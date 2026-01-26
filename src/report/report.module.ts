import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportDatabaseService } from './report-database.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportDatabaseService],
  exports: [ReportService, ReportDatabaseService],
})
export class ReportModule {}
