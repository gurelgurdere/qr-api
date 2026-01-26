import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { AuthUser, UserVariable } from './auth.model';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

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
  email: string;
  imageUri: string;
  userProfileId: number;
  userTypeCode: number;
}

interface UserVariableRow {
  variableName: string;
  variableValue: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    const userRow = await this.findUserByCredentials(username, password);
    if (!userRow) {
      this.logger.warn(`Login attempt failed: invalid credentials - ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch user variables
    const userVariables = await this.fetchUserVariables(
      userRow.firmId,
      userRow.userId,
    );

    const authUser = this.mapToAuthUser(userRow, userVariables);
    const accessToken = this.generateToken(authUser);

    this.logger.log(`User logged in successfully: ${username}`);

    return {
      accessToken,
      user: authUser,
    };
  }

  private async findUserByCredentials(username: string, password: string): Promise<UserRow | null> {
    const sql = `
      SELECT
        u.userId,
        fg.firmGroupId,
        fg.descr AS firmGroupName,
        fg.shortDescr AS firmGroupNameShort,
        f.firmId,
        f.descr AS firmName,
        f.shortDescr AS firmNameShort,
        d.departmentId,
        d.descr AS departmentName,
        a.descr AS authorityName,
        a.authorityLevel,
        p.userPositionId AS positionId,
        p.descr AS positionName,
        u.firstName,
        u.lastName,
        u.username,
        u.email,
        u.imageUri,
        fu.userProfileId,
        t.CODE AS userTypeCode
      FROM 
        qrUser u, 
        qrFirmUser fu, 
        qrDepartment d,
        qrFirmGroup fg,
        qrFirm f,
        qrUserAuthority a,
        qrUserPosition p,
        qrUserType t
      WHERE 
        u.userId = fu.userId
        AND fu.departmentId = d.departmentId
        AND d.firmId = f.firmId
        AND f.firmGroupId = fg.firmGroupId
        AND fu.userPositionId = p.userPositionId
        AND p.userAuthorityId = a.userAuthorityId   
        AND fu.userTypeId = t.userTypeId
        AND u.username = ?
        AND u.password = ?
    `;

    return this.databaseService.queryOne<UserRow>(sql, [username, password]);
  }

  private async fetchUserVariables(
    firmId: number,
    userId: number,
  ): Promise<UserVariable[]> {
    const sql = `
      SELECT 
        v.variableName,
        COALESCE(vv.variableValue, '') AS variableValue
      FROM qrUserVariable v
      LEFT JOIN qrUserVariableValue vv 
        ON vv.userVariableId = v.userVariableId 
        AND vv.firmUserId = ?
      WHERE v.firmId = ?
    `;

    const rows = await this.databaseService.query<UserVariableRow>(sql, [
      userId,
      firmId,
    ]);

    return rows.map((row) => ({
      variableName: row.variableName,
      variableValue: row.variableValue || '',
    }));
  }

  private mapToAuthUser(row: UserRow, userVariables: UserVariable[]): AuthUser {
    return new AuthUser(
      row.userId,
      row.firmGroupId,
      row.firmGroupName || '',
      row.firmGroupNameShort || '',
      row.firmId,
      row.firmName || '',
      row.firmNameShort || '',
      row.departmentId,
      row.departmentName || '',
      row.authorityName || '',
      row.authorityLevel,
      row.positionId,
      row.positionName || '',
      row.firstName,
      row.lastName,
      row.username,
      row.email,
      row.imageUri || '',
      row.userProfileId,
      row.userTypeCode,
      userVariables,
    );
  }

  private generateToken(user: AuthUser): string {
    const payload = {
      sub: user.userId,
      username: user.username,
      user,
    };

    return this.jwtService.sign(payload);
  }
}
