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
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { AuthUser } from '../auth/auth.model';

interface RequestWithUser extends Request {
  user: AuthUser;
}

interface ApiResponse<T = void> {
  status: number;
  message: string;
  data?: T;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser): Promise<ApiResponse<unknown[]>> {
    const users = await this.userService.findAll(req.user);

    return {
      status: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<unknown>> {
    const user = await this.userService.findOne(id, req.user);

    return {
      status: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Post()
  async create(
    @Body() dto: UserDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<{ userId: number }>> {
    const userId = await this.userService.create(dto, req.user);

    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      data: { userId },
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse> {
    // Ensure userId in DTO matches the path parameter
    dto.userId = id;
    await this.userService.update(dto);

    return {
      status: HttpStatus.OK,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse> {
    await this.userService.delete(id);

    return {
      status: HttpStatus.OK,
      message: 'User deleted successfully',
    };
  }
}
