import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserProfile } from './user-profile.model';
import { UserProfileDto } from './dto/user-profile.dto';

interface UserProfileRow {
  userProfileId: number;
  firmId: number;
  descr: string;
}

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(firmId: number): Promise<UserProfile[]> {
    const sql = `SELECT * FROM qrUserProfile WHERE firmId = ?`;
    const rows = await this.databaseService.query<UserProfileRow>(sql, [firmId]);

    return rows.map((row) => this.mapToUserProfile(row));
  }

  async findOne(userProfileId: number, firmId: number): Promise<UserProfile> {
    const sql = `SELECT * FROM qrUserProfile WHERE userProfileId = ? AND firmId = ?`;
    const row = await this.databaseService.queryOne<UserProfileRow>(sql, [
      userProfileId,
      firmId,
    ]);

    if (!row) {
      throw new NotFoundException(
        `User profile with id '${userProfileId}' not found`,
      );
    }

    return this.mapToUserProfile(row);
  }

  async create(firmId: number, dto: UserProfileDto): Promise<UserProfile> {
    const connection = await this.databaseService.beginTransaction();

    try {
      const sql = `
        INSERT INTO qrUserProfile (firmId, descr)
        VALUES (?, ?)
      `;

      const result = await this.databaseService.execute(
        sql,
        [firmId, dto.descr],
        connection,
      );

      await this.databaseService.commit(connection);

      this.logger.log(`User profile created successfully: ${result.insertId}`);

      return {
        id: result.insertId,
        descr: dto.descr,
      };
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to create user profile: ${error.message}`);
      throw error;
    }
  }

  async update(
    userProfileId: number,
    firmId: number,
    dto: UserProfileDto,
  ): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if user profile exists
      const existsSql = `
        SELECT userProfileId FROM qrUserProfile 
        WHERE userProfileId = ? AND firmId = ?
      `;
      const existing = await this.databaseService.queryOneWithConnection<{
        userProfileId: number;
      }>(existsSql, [userProfileId, firmId], connection);

      if (!existing) {
        throw new NotFoundException(
          `User profile with id '${userProfileId}' not found`,
        );
      }

      const sql = `
        UPDATE qrUserProfile 
        SET descr = ? 
        WHERE userProfileId = ? AND firmId = ?
      `;

      await this.databaseService.execute(
        sql,
        [dto.descr, userProfileId, firmId],
        connection,
      );

      await this.databaseService.commit(connection);

      this.logger.log(`User profile updated successfully: ${userProfileId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to update user profile: ${error.message}`);
      throw error;
    }
  }

  async delete(userProfileId: number, firmId: number): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if user profile exists
      const existsSql = `
        SELECT userProfileId FROM qrUserProfile 
        WHERE userProfileId = ? AND firmId = ?
      `;
      const existing = await this.databaseService.queryOneWithConnection<{
        userProfileId: number;
      }>(existsSql, [userProfileId, firmId], connection);

      if (!existing) {
        throw new NotFoundException(
          `User profile with id '${userProfileId}' not found`,
        );
      }

      // Check if user profile is referenced by any user in qrFirmUser
      const referenceSql = `
        SELECT COUNT(*) AS userCount 
        FROM qrFirmUser 
        WHERE userProfileId = ?
      `;
      const referenceResult = await this.databaseService.queryOneWithConnection<{
        userCount: number;
      }>(referenceSql, [userProfileId], connection);

      if ((referenceResult?.userCount ?? 0) > 0) {
        throw new ConflictException(
          `Cannot delete user profile '${userProfileId}': it is assigned to ${referenceResult?.userCount} user(s). Remove assignments first.`,
        );
      }

      const sql = `DELETE FROM qrUserProfile WHERE userProfileId = ? AND firmId = ?`;
      await this.databaseService.execute(sql, [userProfileId, firmId], connection);

      await this.databaseService.commit(connection);

      this.logger.log(`User profile deleted successfully: ${userProfileId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to delete user profile: ${error.message}`);
      throw error;
    }
  }

  private mapToUserProfile(row: UserProfileRow): UserProfile {
    return {
      id: row.userProfileId,
      descr: row.descr,
    };
  }
}
