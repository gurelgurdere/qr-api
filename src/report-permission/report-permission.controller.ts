import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { ReportPermissionService } from './report-permission.service';
import { ReportPermissionDto } from './dto/report-permission.dto';
import { ReportPermission } from './report-permission.model';

interface ApiResponse<T = void> {
  status: number;
  message: string;
  data?: T;
}

@Controller('report-permission')
export class ReportPermissionController {
  constructor(
    private readonly reportPermissionService: ReportPermissionService,
  ) {}

  @Get(':userProfileId')
  async getPermissions(
    @Param('userProfileId', ParseIntPipe) userProfileId: number,
    @Headers('accept-language') langCode: string,
  ): Promise<ApiResponse<ReportPermission[]>> {
    const contentLanguageId = this.parseLanguageCode(langCode);

    const permissions =
      await this.reportPermissionService.getPermissionsByUserProfile(
        userProfileId,
        contentLanguageId,
      );

    return {
      status: HttpStatus.OK,
      message: 'Report permissions retrieved successfully',
      data: permissions,
    };
  }

  @Post()
  async savePermissions(
    @Body() dto: ReportPermissionDto,
  ): Promise<ApiResponse> {
    await this.reportPermissionService.savePermissions(
      dto.userProfileId,
      dto.menuItemIds,
    );

    return {
      status: HttpStatus.OK,
      message: 'Report permissions saved successfully',
    };
  }

  private parseLanguageCode(langCode: string): number {
    const languageMap: Record<string, number> = {
      tr: 1,
      'tr-TR': 1,
      en: 2,
      'en-US': 2,
      'en-GB': 2,
    };

    if (!langCode) {
      return 1; // Default: Turkish
    }

    const primaryLang = langCode.split(',')[0].trim();
    return languageMap[primaryLang] ?? 1;
  }
}
