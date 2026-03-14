import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ReportDatabaseService } from './report-database.service';
import { AuthUser, getUserVariableValue } from '../auth/auth.model';
import {
  ReportDefinition,
  Parameter,
  ParameterListSource,
  ReportColumn,
  ReportLoadResponse,
  ReportExecuteResponse,
  ReportParameterResponse,
  SubReportResponse,
} from './report.model';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly reportsPath: string;

  constructor(private readonly reportDbService: ReportDatabaseService) {
    this.reportsPath = path.join(process.cwd(), 'reports');
  }

  async loadReport(
    reportId: string,
    authUser: AuthUser,
  ): Promise<ReportLoadResponse> {
    // Check if report database is initialized
    if (!this.reportDbService.isInitialized()) {
      throw new BadRequestException(
        'Report database connections are not available',
      );
    }

    // Load report definition
    const reportDef = this.loadReportDefinition(reportId);

    // Check if connection exists
    if (!this.reportDbService.hasConnection(reportDef.dataSource.connectionName)) {
      throw new BadRequestException(
        `Data source '${reportDef.dataSource.connectionName}' is not configured`,
      );
    }

    const queryParams = reportDef.dataSource.query.parameters ?? [];

    // Check if all parameters are userVariable type
    const nonUserVariableParams = queryParams.filter(
      (p) => p.type !== 'userVariable',
    );

    if (nonUserVariableParams.length === 0) {
      // No user input needed, report can be executed directly
      return {
        reportId,
        title: reportDef.title,
        description: reportDef.description,
        requiresParameters: false,
      };
    }

    // Prepare parameters for frontend
    const preparedParams = await this.prepareParametersForFrontend(
      reportDef,
      nonUserVariableParams,
      authUser,
    );

    return {
      reportId,
      title: reportDef.title,
      description: reportDef.description,
      requiresParameters: true,
      parameters: preparedParams,
    };
  }

  async executeReport(
    reportId: string,
    userParams: Record<string, unknown>,
    authUser: AuthUser,
  ): Promise<ReportExecuteResponse> {
    // Check if report database is initialized
    if (!this.reportDbService.isInitialized()) {
      throw new BadRequestException(
        'Report database connections are not available',
      );
    }

    // Load report definition
    const reportDef = this.loadReportDefinition(reportId);

    // Check if connection exists
    if (!this.reportDbService.hasConnection(reportDef.dataSource.connectionName)) {
      throw new BadRequestException(
        `Data source '${reportDef.dataSource.connectionName}' is not configured`,
      );
    }

    // Build SQL and parameters
    const { sql, parameters } = this.buildQueryWithParameters(
      reportDef,
      userParams,
      authUser,
    );

    // Execute query
    const result = await this.reportDbService.executeQuery(
      reportDef.dataSource.connectionName,
      sql,
      parameters,
    );

    // Build columns (including visibility check)
    const columns = this.buildColumns(reportDef, result.columns, authUser);

    // Calculate custom columns and filter data by visible columns
    const visibleColumnNames = columns.map((c) => c.name);
    const processedData = this.processData(
      result.rows,
      reportDef.columns ?? [],
      visibleColumnNames,
      authUser,
    );

    // Resolve sub-reports with titles
    const subReports = this.resolveSubReports(reportDef);

    const response: ReportExecuteResponse = {
      reportId,
      title: reportDef.title,
      description: reportDef.description,
      columns,
      data: processedData,
    };

    if (subReports.length > 0) {
      response.subReports = subReports;
    }

    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helper methods
  // ─────────────────────────────────────────────────────────────────────────────

  private loadReportDefinition(reportId: string): ReportDefinition {
    const filePath = path.join(this.reportsPath, `${reportId}.qr.json`);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Report '${reportId}' not found`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as ReportDefinition;
    } catch (error) {
      this.logger.error(`Failed to parse report definition: ${error.message}`);
      throw new BadRequestException(
        `Failed to load report '${reportId}': invalid format`,
      );
    }
  }

  private async prepareParametersForFrontend(
    reportDef: ReportDefinition,
    params: Parameter[],
    authUser: AuthUser,
  ): Promise<ReportParameterResponse[]> {
    const result: ReportParameterResponse[] = [];

    for (const param of params) {
      const paramResponse: ReportParameterResponse = {
        id: param.id,
        type: param.type,
        description: param.description,
      };

      if (param.type === 'list' && param.source) {
        const listSource = param.source as ParameterListSource;

        if (listSource.static) {
          // Static list
          paramResponse.data = listSource.static;
        } else if (listSource.sql) {
          // Dynamic list from SQL
          const listData = await this.fetchListData(
            reportDef.dataSource.connectionName,
            listSource,
            authUser,
          );
          paramResponse.data = listData;
        }

        paramResponse.key = param.key;
        paramResponse.display = param.display;
      }

      result.push(paramResponse);
    }

    return result;
  }

  private async fetchListData(
    connectionName: string,
    listSource: ParameterListSource,
    authUser: AuthUser,
  ): Promise<Array<Record<string, unknown>>> {
    const sql = listSource.sql.join(' ');
    const params: Record<string, unknown> = {};

    // List SQL can only have userVariable parameters
    if (listSource.parameters) {
      for (const param of listSource.parameters) {
        if (param.type === 'userVariable') {
          const varName = typeof param.source === 'string' ? param.source : param.id;
          const value = getUserVariableValue(authUser, varName);
          if (value !== undefined) {
            params[param.id] = value;
          }
        }
      }
    }

    const result = await this.reportDbService.executeQuery(
      connectionName,
      sql,
      params,
    );

    return result.rows;
  }

  private buildQueryWithParameters(
    reportDef: ReportDefinition,
    userParams: Record<string, unknown>,
    authUser: AuthUser,
  ): { sql: string; parameters: Record<string, unknown> } {
    const sql = reportDef.dataSource.query.sql.join(' ');
    const queryParams = reportDef.dataSource.query.parameters ?? [];
    const parameters: Record<string, unknown> = {};

    for (const param of queryParams) {
      if (param.type === 'userVariable') {
        // Get from user variables
        const varName = typeof param.source === 'string' ? param.source : param.id;
        const value = getUserVariableValue(authUser, varName);
        if (value === undefined) {
          throw new BadRequestException(
            `User variable '${varName}' is not defined for this user`,
          );
        }
        parameters[param.id] = value;
      } else {
        // Get from user-provided parameters
        if (!(param.id in userParams)) {
          throw new BadRequestException(
            `Missing required parameter: ${param.id}`,
          );
        }
        parameters[param.id] = userParams[param.id];
      }
    }

    return { sql, parameters };
  }

  private buildColumns(
    reportDef: ReportDefinition,
    queryColumns: Array<{ name: string; type: 'string' | 'number' | 'date' }>,
    authUser: AuthUser,
  ): ReportColumn[] {
    let columns: ReportColumn[];

    // If columns are defined in report definition, use them
    if (reportDef.columns && reportDef.columns.length > 0) {
      columns = reportDef.columns;
    } else {
      // Otherwise, build columns from query metadata
      columns = queryColumns.map((col) => ({
        name: col.name,
        header: col.name,
        type: col.type,
        alignment: this.getDefaultAlignment(col.type),
      }));
    }

    // Filter columns by visibility rules
    return columns.filter((col) => this.isColumnVisible(col, authUser));
  }

  private isColumnVisible(column: ReportColumn, authUser: AuthUser): boolean {
    // If no visibility rule, column is always visible
    if (!column.visible) {
      return true;
    }

    try {
      // Build parameter values for the visibility expression
      const paramValues = this.buildExpressionParams(
        column.visible.parameters,
        {},
        authUser,
      );

      // Evaluate the visibility expression
      return this.evaluateExpression(column.visible.expr, paramValues) as boolean;
    } catch (error) {
      this.logger.warn(
        `Failed to evaluate visibility for column '${column.name}': ${error.message}`,
      );
      // Default to visible if evaluation fails
      return true;
    }
  }

  private buildExpressionParams(
    parameters: Parameter[],
    row: Record<string, unknown>,
    authUser: AuthUser,
  ): unknown[] {
    return parameters.map((param) => {
      if (param.type === 'userVariable') {
        const varName = typeof param.source === 'string' ? param.source : param.id;
        const value = getUserVariableValue(authUser, varName);
        // Try to convert to number for numeric comparisons
        const numValue = Number(value);
        return isNaN(numValue) ? value : numValue;
      } else if (param.type === 'column') {
        const colName = typeof param.source === 'string' ? param.source : param.id;
        return row[colName];
      }
      return undefined;
    });
  }

  private evaluateExpression(expr: string, paramValues: unknown[]): unknown {
    // Create function from expression string and execute with parameter values
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(`return ${expr}`)();
    return fn(...paramValues);
  }

  private processData(
    rows: Array<Record<string, unknown>>,
    columnDefs: ReportColumn[],
    visibleColumnNames: string[],
    authUser: AuthUser,
  ): Array<Record<string, unknown>> {
    // Get custom columns (those with function definitions)
    const customColumns = columnDefs.filter(
      (col) => col.function && visibleColumnNames.includes(col.name),
    );

    return rows.map((row) => {
      // Create a working copy of the row for calculations
      const workingRow = { ...row };

      // Calculate custom columns in order (order in columns array determines dependency)
      for (const customCol of customColumns) {
        const paramValues = this.buildExpressionParams(
          customCol.function!.parameters,
          workingRow,
          authUser,
        );

        try {
          const calculatedValue = this.evaluateExpression(
            customCol.function!.expr,
            paramValues,
          );
          workingRow[customCol.name] = calculatedValue;
        } catch (error) {
          this.logger.warn(
            `Failed to calculate custom column '${customCol.name}': ${error.message}`,
          );
          workingRow[customCol.name] = null;
        }
      }

      // Filter to only visible columns
      const filteredRow: Record<string, unknown> = {};
      for (const colName of visibleColumnNames) {
        if (colName in workingRow) {
          filteredRow[colName] = workingRow[colName];
        }
      }

      return filteredRow;
    });
  }

  private resolveSubReports(reportDef: ReportDefinition): SubReportResponse[] {
    if (!reportDef.subReports || reportDef.subReports.length === 0) {
      return [];
    }

    return reportDef.subReports.map((sub) => {
      let title = sub.id;
      try {
        const subReportDef = this.loadReportDefinition(sub.id);
        title = subReportDef.title;
      } catch (error) {
        this.logger.warn(
          `Failed to load sub-report '${sub.id}' for title resolution: ${error.message}`,
        );
      }

      return {
        id: sub.id,
        title,
        parameters: sub.parameters,
      };
    });
  }

  private getDefaultAlignment(
    type: 'string' | 'number' | 'date',
  ): 'left' | 'center' | 'right' {
    switch (type) {
      case 'number':
        return 'right';
      case 'date':
        return 'center';
      default:
        return 'left';
    }
  }
}
