import { Module } from '@nestjs/common';
import { ReportPermissionController } from './report-permission.controller';
import { ReportPermissionService } from './report-permission.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportPermissionController],
  providers: [ReportPermissionService],
})
export class ReportPermissionModule {}
