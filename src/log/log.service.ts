import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ServiceUsageLog } from './log.model';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async log(entry: ServiceUsageLog): Promise<void> {
    try {
      const sql = `
        INSERT INTO qrServiceUsageLog 
        (serviceName, serviceData, userId, usageTime, resultMessage)
        VALUES (?, ?, ?, ?, ?)
      `;

      // Truncate serviceData if too long (max 2048 chars)
      const serviceData = entry.serviceData
        ? entry.serviceData.substring(0, 2048)
        : null;

      // Truncate resultMessage if too long (max 512 chars)
      const resultMessage = entry.resultMessage
        ? entry.resultMessage.substring(0, 512)
        : null;

      await this.databaseService.execute(sql, [
        entry.serviceName.substring(0, 128),
        serviceData,
        entry.userId ?? null,
        entry.usageTime,
        resultMessage,
      ]);
    } catch (error) {
      // Log errors should not break the application flow
      this.logger.error(`Failed to write service usage log: ${error.message}`);
    }
  }
}
