import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UserProfile } from './user-profile.model';
import { UserProfileDto } from './dto/user-profile.dto';
import { AuthUser } from '../auth/auth.model';

interface RequestWithUser extends Request {
  user: AuthUser;
}

interface ApiResponse<T = void> {
  status: number;
  message: string;
  data?: T;
}

@Controller('user-profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser): Promise<ApiResponse<UserProfile[]>> {
    const firmId = req.user.firmId;
    const profiles = await this.userProfileService.findAll(firmId);

    return {
      status: HttpStatus.OK,
      message: 'User profiles retrieved successfully',
      data: profiles,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<UserProfile>> {
    const firmId = req.user.firmId;
    const profile = await this.userProfileService.findOne(id, firmId);

    return {
      status: HttpStatus.OK,
      message: 'User profile retrieved successfully',
      data: profile,
    };
  }

  @Post()
  async create(
    @Body() dto: UserProfileDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<UserProfile>> {
    const firmId = req.user.firmId;
    const profile = await this.userProfileService.create(firmId, dto);

    return {
      status: HttpStatus.CREATED,
      message: 'User profile created successfully',
      data: profile,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserProfileDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse> {
    const firmId = req.user.firmId;
    await this.userProfileService.update(id, firmId, dto);

    return {
      status: HttpStatus.OK,
      message: 'User profile updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse> {
    const firmId = req.user.firmId;
    await this.userProfileService.delete(id, firmId);

    return {
      status: HttpStatus.OK,
      message: 'User profile deleted successfully',
    };
  }
}
