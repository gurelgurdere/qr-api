import {
  Controller,
  Post,
  Body,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ReportService } from './report.service';
import {
  ReportLoadRequest,
  ReportExecuteRequest,
  ReportLoadResponse,
  ReportExecuteResponse,
} from './report.model';
import { AuthUser } from '../auth/auth.model';

interface RequestWithUser extends Request {
  user: AuthUser;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('load')
  async loadReport(
    @Body() request: ReportLoadRequest,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<ReportLoadResponse>> {
    const result = await this.reportService.loadReport(
      request.reportId,
      req.user,
    );

    const message = result.requiresParameters
      ? 'Report definition loaded. Parameters required.'
      : 'Report definition loaded. Ready to execute.';

    return {
      status: HttpStatus.OK,
      message,
      data: result,
    };
  }

  @Post('execute')
  async executeReport(
    @Body() request: ReportExecuteRequest,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<ReportExecuteResponse>> {
    const result = await this.reportService.executeReport(
      request.reportId,
      request.parameters ?? {},
      req.user,
    );

    return {
      status: HttpStatus.OK,
      message: 'Report executed successfully',
      data: result,
    };
  }
}
