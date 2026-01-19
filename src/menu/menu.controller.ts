import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Headers,
  Req,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { Menu, MenuItem } from './menu.model';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { AuthUser } from '../auth/auth.model';

interface RequestWithUser extends Request {
  user: AuthUser;
}

interface ApiResponse<T = void> {
  status: number;
  message: string;
  data?: T;
}

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async getMenu(
    @Headers('accept-language') langCode: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<Menu>> {
    const contentLanguageId = this.parseLanguageCode(langCode);
    const userProfileId = req.user.userProfileId;

    const menu = await this.menuService.getMenuByUserProfile(
      contentLanguageId,
      userProfileId,
    );

    return {
      status: HttpStatus.OK,
      message: 'Menu retrieved successfully',
      data: menu,
    };
  }

  @Post('item')
  async createMenuItem(
    @Body() dto: CreateMenuItemDto,
  ): Promise<ApiResponse<MenuItem>> {
    const menuItem = await this.menuService.createMenuItem(dto);

    return {
      status: HttpStatus.CREATED,
      message: 'Menu item created successfully',
      data: menuItem,
    };
  }

  @Put('item/:id')
  async updateMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<ApiResponse> {
    await this.menuService.updateMenuItem(id, dto);

    return {
      status: HttpStatus.OK,
      message: 'Menu item updated successfully',
    };
  }

  @Delete('item/:id')
  @HttpCode(HttpStatus.OK)
  async deleteMenuItem(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    await this.menuService.deleteMenuItem(id);

    return {
      status: HttpStatus.OK,
      message: 'Menu item deleted successfully',
    };
  }

  private parseLanguageCode(langCode: string): number {
    // Map language codes to database content language IDs
    // Default to Turkish (1) if not specified or unrecognized
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

    // Handle multiple language preferences (e.g., "tr-TR,tr;q=0.9,en;q=0.8")
    const primaryLang = langCode.split(',')[0].trim();

    return languageMap[primaryLang] ?? 1;
  }
}
