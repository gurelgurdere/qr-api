import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as sql from 'mssql';
import * as oracledb from 'oracledb';
import * as fs from 'fs';
import * as path from 'path';

interface ReportDbConfig {
  type: 'mssql' | 'oracle';
  version: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
  serviceName?: string;
  requestTimeout?: number;
  extra?: {
    trustServerCertificate?: boolean;
    poolSize?: number;
    connectionTimeoutMillis?: number;
  };
}

interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date';
}

interface QueryResult {
  rows: Record<string, unknown>[];
  columns: ColumnMetadata[];
}

@Injectable()
export class ReportDatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportDatabaseService.name);
  private mssqlPools: Map<string, sql.ConnectionPool> = new Map();
  private oraclePools: Map<string, oracledb.Pool> = new Map();
  private configs: Map<string, ReportDbConfig> = new Map();
  private initialized = false;

  async onModuleInit(): Promise<void> {
    await this.initializePools();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closePools();
  }

  private async initializePools(): Promise<void> {
    const configPath = path.join(process.cwd(), 'report-dbconfig.json');

    if (!fs.existsSync(configPath)) {
      this.logger.warn(
        'report-dbconfig.json not found. Report module will not be available.',
      );
      return;
    }

    let configs: ReportDbConfig[];
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      configs = JSON.parse(configContent);
    } catch (error) {
      this.logger.error(
        `Failed to parse report-dbconfig.json: ${error.message}`,
      );
      return;
    }

    if (!Array.isArray(configs) || configs.length === 0) {
      this.logger.warn(
        'report-dbconfig.json is empty or invalid. Report module will not be available.',
      );
      return;
    }

    for (const config of configs) {
      try {
        this.configs.set(config.name, config);

        if (config.type === 'mssql') {
          await this.initMssqlPool(config);
        } else if (config.type === 'oracle') {
          await this.initOraclePool(config);
        } else {
          this.logger.warn(`Unknown database type: ${config.type}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to initialize pool for ${config.name}: ${error.message}`,
        );
      }
    }

    this.initialized = true;
    this.logger.log(
      `Report database pools initialized: ${this.mssqlPools.size} MSSQL, ${this.oraclePools.size} Oracle`,
    );
  }

  private async initMssqlPool(config: ReportDbConfig): Promise<void> {
    const poolConfig: sql.config = {
      server: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      requestTimeout: config.requestTimeout ?? 30000,
      options: {
        encrypt: false,
        trustServerCertificate: config.extra?.trustServerCertificate ?? true,
      },
      pool: {
        max: config.extra?.poolSize ?? 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    const pool = await new sql.ConnectionPool(poolConfig).connect();
    this.mssqlPools.set(config.name, pool);
    this.logger.log(`MSSQL pool initialized: ${config.name}`);
  }

  private async initOraclePool(config: ReportDbConfig): Promise<void> {
    const poolConfig: oracledb.PoolAttributes = {
      user: config.username,
      password: config.password,
      connectString: `${config.host}:${config.port}/${config.serviceName}`,
      poolMin: 0,
      poolMax: config.extra?.poolSize ?? 10,
      poolIncrement: 1,
      poolAlias: config.name,
    };

    const pool = await oracledb.createPool(poolConfig);
    this.oraclePools.set(config.name, pool);
    this.logger.log(`Oracle pool initialized: ${config.name}`);
  }

  private async closePools(): Promise<void> {
    // Close MSSQL pools
    for (const [name, pool] of this.mssqlPools) {
      try {
        await pool.close();
        this.logger.log(`MSSQL pool closed: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to close MSSQL pool ${name}: ${error.message}`);
      }
    }
    this.mssqlPools.clear();

    // Close Oracle pools
    for (const [name, pool] of this.oraclePools) {
      try {
        await pool.close(0);
        this.logger.log(`Oracle pool closed: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to close Oracle pool ${name}: ${error.message}`);
      }
    }
    this.oraclePools.clear();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  hasConnection(connectionName: string): boolean {
    return (
      this.mssqlPools.has(connectionName) ||
      this.oraclePools.has(connectionName)
    );
  }

  getConnectionType(connectionName: string): 'mssql' | 'oracle' | null {
    if (this.mssqlPools.has(connectionName)) return 'mssql';
    if (this.oraclePools.has(connectionName)) return 'oracle';
    return null;
  }

  async executeQuery(
    connectionName: string,
    sqlQuery: string,
    parameters: Record<string, unknown> = {},
  ): Promise<QueryResult> {
    const dbType = this.getConnectionType(connectionName);

    if (!dbType) {
      throw new Error(`Connection '${connectionName}' not found`);
    }

    if (dbType === 'mssql') {
      return this.executeMssqlQuery(connectionName, sqlQuery, parameters);
    } else {
      return this.executeOracleQuery(connectionName, sqlQuery, parameters);
    }
  }

  private async executeMssqlQuery(
    connectionName: string,
    sqlQuery: string,
    parameters: Record<string, unknown>,
  ): Promise<QueryResult> {
    const pool = this.mssqlPools.get(connectionName);
    if (!pool) {
      throw new Error(`MSSQL pool '${connectionName}' not found`);
    }

    // Convert :param to @param for MSSQL
    let mssqlQuery = sqlQuery;
    const paramRegex = /:([A-Za-z_][A-Za-z0-9_]*)/g;
    mssqlQuery = mssqlQuery.replace(paramRegex, '@$1');

    const request = pool.request();

    // Add parameters
    for (const [key, value] of Object.entries(parameters)) {
      request.input(key, value);
    }

    const result = await request.query(mssqlQuery);

    // Extract column metadata
    const columns: ColumnMetadata[] = [];
    if (result.recordset && result.recordset.columns) {
      for (const [name, column] of Object.entries(result.recordset.columns)) {
        const colMeta = column as { type: sql.ISqlTypeFactory | sql.ISqlTypeFactoryWithNoParams };
        columns.push({
          name,
          type: this.mssqlTypeToColumnType(colMeta.type),
        });
      }
    }

    return {
      rows: result.recordset ?? [],
      columns,
    };
  }

  private async executeOracleQuery(
    connectionName: string,
    sqlQuery: string,
    parameters: Record<string, unknown>,
  ): Promise<QueryResult> {
    const pool = this.oraclePools.get(connectionName);
    if (!pool) {
      throw new Error(`Oracle pool '${connectionName}' not found`);
    }

    const connection = await pool.getConnection();

    try {
      // Oracle uses :param format natively
      const result = await connection.execute(sqlQuery, parameters, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      // Extract column metadata
      const columns: ColumnMetadata[] = [];
      if (result.metaData) {
        for (const meta of result.metaData) {
          columns.push({
            name: meta.name,
            type: this.oracleTypeToColumnType(meta.dbType),
          });
        }
      }

      return {
        rows: (result.rows as Record<string, unknown>[]) ?? [],
        columns,
      };
    } finally {
      await connection.close();
    }
  }

  private mssqlTypeToColumnType(
    sqlType: sql.ISqlTypeFactory | sql.ISqlTypeFactoryWithNoParams,
  ): 'string' | 'number' | 'date' {
    const typeName = (sqlType as { name?: string }).name?.toLowerCase() ?? '';

    if (
      typeName.includes('int') ||
      typeName.includes('decimal') ||
      typeName.includes('numeric') ||
      typeName.includes('float') ||
      typeName.includes('real') ||
      typeName.includes('money')
    ) {
      return 'number';
    }

    if (
      typeName.includes('date') ||
      typeName.includes('time')
    ) {
      return 'date';
    }

    return 'string';
  }

  private oracleTypeToColumnType(dbType: number | undefined): 'string' | 'number' | 'date' {
    if (dbType === undefined) return 'string';

    // Oracle DB types
    // NUMBER types: 2 (NUMBER), 101 (BINARY_FLOAT), 100 (BINARY_DOUBLE)
    // DATE types: 12 (DATE), 187 (TIMESTAMP), 188 (TIMESTAMP WITH TZ)
    if (dbType === 2 || dbType === 100 || dbType === 101) {
      return 'number';
    }

    if (dbType === 12 || dbType === 187 || dbType === 188) {
      return 'date';
    }

    return 'string';
  }
}
