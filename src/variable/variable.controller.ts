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
import { VariableService } from './variable.service';
import { Variable } from './variable.model';
import { VariableDto } from './dto/variable.dto';
import { AuthUser } from '../auth/auth.model';

interface RequestWithUser extends Request {
  user: AuthUser;
}

interface ApiResponse<T = void> {
  status: number;
  message: string;
  data?: T;
}

@Controller('variable')
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser): Promise<ApiResponse<Variable[]>> {
    const firmId = req.user.firmId;
    const variables = await this.variableService.findAll(firmId);

    return {
      status: HttpStatus.OK,
      message: 'Variables retrieved successfully',
      data: variables,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<Variable>> {
    const firmId = req.user.firmId;
    const variable = await this.variableService.findOne(id, firmId);

    return {
      status: HttpStatus.OK,
      message: 'Variable retrieved successfully',
      data: variable,
    };
  }

  @Post()
  async create(
    @Body() dto: VariableDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<Variable>> {
    const firmId = req.user.firmId;
    const variable = await this.variableService.create(firmId, dto);

    return {
      status: HttpStatus.CREATED,
      message: 'Variable created successfully',
      data: variable,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VariableDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse> {
    const firmId = req.user.firmId;
    await this.variableService.update(id, firmId, dto);

    return {
      status: HttpStatus.OK,
      message: 'Variable updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse> {
    const firmId = req.user.firmId;
    await this.variableService.delete(id, firmId);

    return {
      status: HttpStatus.OK,
      message: 'Variable deleted successfully',
    };
  }
}
