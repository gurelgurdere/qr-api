import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DatabaseService,
  TransactionConnection,
} from '../database/database.service';
import { AuthUser } from '../auth/auth.model';
import { UserDto, UserVariableDto } from './dto/user.dto';
import { Variable } from '../variable/variable.model';

interface UserRow {
  userId: number;
  firmGroupId: number;
  firmGroupName: string;
  firmGroupNameShort: string;
  firmId: number;
  firmName: string;
  firmNameShort: string;
  departmentId: number;
  departmentName: string;
  authorityName: string;
  authorityLevel: number;
  positionId: number;
  positionName: string;
  firstName: string;
  lastName: string;
  username: string;
  PASSWORD: string;
  email: string;
  imageUri: string;
  userProfileId: number;
  userTypeCode: number;
  active: number;
}

interface UserVariableRow {
  variableId: number;
  variableName: string;
  variableValue: string;
}

interface CreateUserResult {
  firmUserId: number;
}

interface DeleteUserResult {
  resultCode: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(authUser: AuthUser): Promise<UserRow[]> {
    const result = await this.databaseService.query<UserRow[]>(
      'CALL qrGetAllUsersOfFirm(?)',
      [authUser.firmId],
    );

    // CALL returns nested array, first element contains the data
    return (result as unknown as UserRow[][])[0] ?? [];
  }

  async findOne(userId: number, authUser: AuthUser): Promise<UserRow & { userVariables: Variable[] }> {
    const result = await this.databaseService.query<UserRow[]>(
      'CALL qrGetUser(?)',
      [userId],
    );

    const users = (result as unknown as UserRow[][])[0];
    if (!users || users.length === 0) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    const user = users[0];

    // Get user variables
    const variablesResult = await this.databaseService.query<UserVariableRow[]>(
      'CALL qrGetUserVariables(?, ?)',
      [authUser.firmId, userId],
    );

    const userVariables = ((variablesResult as unknown as UserVariableRow[][])[0] ?? []).map(
      (row) => ({
        variableId: row.variableId,
        variableName: row.variableName,
        variableValue: row.variableValue,
      }),
    );

    return {
      ...user,
      userVariables,
    };
  }

  async create(dto: UserDto, authUser: AuthUser): Promise<number> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if email already exists
      await this.checkEmailUniqueness(dto.email, undefined, connection);

      // Create user using stored procedure
      const result = await this.databaseService.queryWithConnection<CreateUserResult[]>(
        'CALL qrCreateBasicUser(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          dto.firstName,
          dto.lastName,
          dto.email,
          dto.password,
          authUser.firmId,
          authUser.firmGroupId,
          dto.departmentId,
          dto.userProfileId,
          dto.userPositionId,
          dto.userTypeId,
          dto.active,
        ],
        connection,
      );

      const resultData = (result as unknown as CreateUserResult[][])[0];
      if (!resultData || resultData.length === 0 || !resultData[0].firmUserId) {
        throw new Error('Failed to create user: no ID returned from procedure');
      }

      const newUserId = resultData[0].firmUserId;

      // Save user variables if provided
      if (dto.userVariables && dto.userVariables.length > 0) {
        await this.saveUserVariables(newUserId, dto.userVariables, connection);
      }

      await this.databaseService.commit(connection);

      this.logger.log(`User created successfully: ${newUserId}`);
      return newUserId;
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }

  async update(dto: UserDto): Promise<void> {
    if (!dto.userId) {
      throw new Error('userId is required for update operation');
    }

    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if email already exists for another user
      await this.checkEmailUniqueness(dto.email, dto.userId, connection);

      // Update user using stored procedure
      await this.databaseService.queryWithConnection(
        'CALL qrUpdateBasicUser(?, ?, ?, ?, ?, ?, ?, ?)',
        [
          dto.firstName,
          dto.lastName,
          dto.email,
          dto.password,
          dto.userId,
          dto.userTypeId,
          dto.userProfileId,
          dto.active,
        ],
        connection,
      );

      // Save user variables (delete all and re-insert)
      await this.saveUserVariables(dto.userId, dto.userVariables ?? [], connection);

      await this.databaseService.commit(connection);

      this.logger.log(`User updated successfully: ${dto.userId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to update user: ${error.message}`);
      throw error;
    }
  }

  async delete(userId: number): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Delete user using stored procedure
      const result = await this.databaseService.queryWithConnection<DeleteUserResult[]>(
        'CALL qrDeleteBasicUser(?)',
        [userId],
        connection,
      );

      const resultData = (result as unknown as DeleteUserResult[][])[0];
      if (resultData && resultData.length > 0 && resultData[0].resultCode > 0) {
        // Delete user variable values
        await this.databaseService.execute(
          'DELETE FROM qrUserVariableValue WHERE firmUserId = ?',
          [userId],
          connection,
        );
      }

      await this.databaseService.commit(connection);

      this.logger.log(`User deleted successfully: ${userId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to delete user: ${error.message}`);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helper methods
  // ─────────────────────────────────────────────────────────────────────────────

  private async checkEmailUniqueness(
    email: string,
    excludeFirmUserId: number | undefined,
    connection: TransactionConnection,
  ): Promise<void> {
    // Note: excludeFirmUserId is firmUserId from qrFirmUser table, not userId from qrUser
    let sql = `
      SELECT fu.firmUserId 
      FROM qrUser u
      INNER JOIN qrFirmUser fu ON fu.userId = u.userId
      WHERE u.email = ?
    `;
    const params: unknown[] = [email];

    if (excludeFirmUserId !== undefined) {
      sql += ' AND fu.firmUserId != ?';
      params.push(excludeFirmUserId);
    }

    const existing = await this.databaseService.queryOneWithConnection<{ firmUserId: number }>(
      sql,
      params,
      connection,
    );

    if (existing) {
      throw new ConflictException(`Email '${email}' is already registered`);
    }
  }

  private async saveUserVariables(
    userId: number,
    userVariables: UserVariableDto[],
    connection: TransactionConnection,
  ): Promise<void> {
    // Delete existing variable values
    await this.databaseService.execute(
      'DELETE FROM qrUserVariableValue WHERE firmUserId = ?',
      [userId],
      connection,
    );

    // Insert new variable values
    for (const variable of userVariables) {
      if (variable.variableValue) {
        await this.databaseService.execute(
          'INSERT INTO qrUserVariableValue (userVariableId, firmUserId, variableValue) VALUES (?, ?, ?)',
          [variable.variableId, userId, variable.variableValue],
          connection,
        );
      }
    }
  }
}
