import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Variable } from './variable.model';
import { VariableDto } from './dto/variable.dto';

interface VariableRow {
  userVariableId: number;
  firmId: number;
  variableName: string;
}

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(firmId: number): Promise<Variable[]> {
    const sql = `SELECT * FROM qrUserVariable WHERE firmId = ?`;
    const rows = await this.databaseService.query<VariableRow>(sql, [firmId]);

    return rows.map((row) => this.mapToVariable(row));
  }

  async findOne(userVariableId: number, firmId: number): Promise<Variable> {
    const sql = `SELECT * FROM qrUserVariable WHERE userVariableId = ? AND firmId = ?`;
    const row = await this.databaseService.queryOne<VariableRow>(sql, [
      userVariableId,
      firmId,
    ]);

    if (!row) {
      throw new NotFoundException(
        `Variable with id '${userVariableId}' not found`,
      );
    }

    return this.mapToVariable(row);
  }

  async create(firmId: number, dto: VariableDto): Promise<Variable> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if variable name already exists for this firm
      const existsSql = `
        SELECT userVariableId FROM qrUserVariable 
        WHERE firmId = ? AND variableName = ?
      `;
      const existing = await this.databaseService.queryOneWithConnection<{
        userVariableId: number;
      }>(existsSql, [firmId, dto.variableName], connection);

      if (existing) {
        throw new ConflictException(
          `Variable with name '${dto.variableName}' already exists`,
        );
      }

      const sql = `
        INSERT INTO qrUserVariable (firmId, variableName)
        VALUES (?, ?)
      `;

      const result = await this.databaseService.execute(
        sql,
        [firmId, dto.variableName],
        connection,
      );

      await this.databaseService.commit(connection);

      this.logger.log(`Variable created successfully: ${result.insertId}`);

      return {
        variableId: result.insertId,
        variableName: dto.variableName,
      };
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to create variable: ${error.message}`);
      throw error;
    }
  }

  async update(
    userVariableId: number,
    firmId: number,
    dto: VariableDto,
  ): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if variable exists
      const existsSql = `
        SELECT userVariableId FROM qrUserVariable 
        WHERE userVariableId = ? AND firmId = ?
      `;
      const existing = await this.databaseService.queryOneWithConnection<{
        userVariableId: number;
      }>(existsSql, [userVariableId, firmId], connection);

      if (!existing) {
        throw new NotFoundException(
          `Variable with id '${userVariableId}' not found`,
        );
      }

      // Check if new variable name already exists for another variable
      const duplicateSql = `
        SELECT userVariableId FROM qrUserVariable 
        WHERE firmId = ? AND variableName = ? AND userVariableId != ?
      `;
      const duplicate = await this.databaseService.queryOneWithConnection<{
        userVariableId: number;
      }>(duplicateSql, [firmId, dto.variableName, userVariableId], connection);

      if (duplicate) {
        throw new ConflictException(
          `Variable with name '${dto.variableName}' already exists`,
        );
      }

      const sql = `
        UPDATE qrUserVariable 
        SET variableName = ? 
        WHERE userVariableId = ? AND firmId = ?
      `;

      await this.databaseService.execute(
        sql,
        [dto.variableName, userVariableId, firmId],
        connection,
      );

      await this.databaseService.commit(connection);

      this.logger.log(`Variable updated successfully: ${userVariableId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to update variable: ${error.message}`);
      throw error;
    }
  }

  async delete(userVariableId: number, firmId: number): Promise<void> {
    const connection = await this.databaseService.beginTransaction();

    try {
      // Check if variable exists
      const existsSql = `
        SELECT userVariableId FROM qrUserVariable 
        WHERE userVariableId = ? AND firmId = ?
      `;
      const existing = await this.databaseService.queryOneWithConnection<{
        userVariableId: number;
      }>(existsSql, [userVariableId, firmId], connection);

      if (!existing) {
        throw new NotFoundException(
          `Variable with id '${userVariableId}' not found`,
        );
      }

      // Check if variable has values assigned in qrUserVariableValue
      const referenceSql = `
        SELECT COUNT(*) AS valueCount 
        FROM qrUserVariableValue 
        WHERE userVariableId = ?
      `;
      const referenceResult = await this.databaseService.queryOneWithConnection<{
        valueCount: number;
      }>(referenceSql, [userVariableId], connection);

      if ((referenceResult?.valueCount ?? 0) > 0) {
        throw new ConflictException(
          `Cannot delete variable '${userVariableId}': it has ${referenceResult?.valueCount} value(s) assigned. Remove values first.`,
        );
      }

      const sql = `DELETE FROM qrUserVariable WHERE userVariableId = ? AND firmId = ?`;
      await this.databaseService.execute(sql, [userVariableId, firmId], connection);

      await this.databaseService.commit(connection);

      this.logger.log(`Variable deleted successfully: ${userVariableId}`);
    } catch (error) {
      await this.databaseService.rollback(connection);
      this.logger.error(`Failed to delete variable: ${error.message}`);
      throw error;
    }
  }

  private mapToVariable(row: VariableRow): Variable {
    return {
      variableId: row.userVariableId,
      variableName: row.variableName,
    };
  }
}
