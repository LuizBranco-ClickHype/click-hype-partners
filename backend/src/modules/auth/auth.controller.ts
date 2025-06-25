import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PartnerGuard } from './guards/partner.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login do administrador' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('partner/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Login do parceiro realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        partner: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyName: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string' },
            commissionPercentage: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async partnerLogin(@Body() loginDto: LoginDto) {
    return this.authService.partnerLogin(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  getProfile(@Request() req) {
    return {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  @Get('partner/profile')
  @UseGuards(PartnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do parceiro autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do parceiro',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  getPartnerProfile(@Request() req) {
    return {
      partner: req.user,
    };
  }
} 