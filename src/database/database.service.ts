import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

interface AppDbConfig {
  db: string;
  version: string;
  dbHost: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
}

export type TransactionConnection = mysql.PoolConnection;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: mysql.Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    const configPath = path.join(process.cwd(), 'app-dbconfig.json');
    const config: AppDbConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    this.pool = mysql.createPool({
      host: config.dbHost,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    this.logger.log('MySQL connection pool initialized');
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T[];
  }

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(
    sql: string,
    params?: unknown[],
    connection?: TransactionConnection,
  ): Promise<mysql.ResultSetHeader> {
    const conn = connection ?? this.pool;
    const [result] = await conn.execute(sql, params);
    return result as mysql.ResultSetHeader;
  }

  async beginTransaction(): Promise<TransactionConnection> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  async commit(connection: TransactionConnection): Promise<void> {
    await connection.commit();
    connection.release();
  }

  async rollback(connection: TransactionConnection): Promise<void> {
    await connection.rollback();
    connection.release();
  }

  async queryWithConnection<T>(
    sql: string,
    params: unknown[],
    connection: TransactionConnection,
  ): Promise<T[]> {
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
  }

  async queryOneWithConnection<T>(
    sql: string,
    params: unknown[],
    connection: TransactionConnection,
  ): Promise<T | null> {
    const rows = await this.queryWithConnection<T>(sql, params, connection);
    return rows.length > 0 ? rows[0] : null;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('MySQL connection pool closed');
    }
  }
}
