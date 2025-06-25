import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PartnerGuard } from '../auth/guards/partner.guard';

@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get('me')
  @UseGuards(PartnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do parceiro logado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do parceiro retornados com sucesso',
  })
  getMe(@Req() req: any) {
    return this.partnersService.findById(req.user.partnerId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo parceiro' })
  @ApiResponse({
    status: 201,
    description: 'Parceiro criado com sucesso',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um parceiro com este email',
  })
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os parceiros com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de parceiros retornada com sucesso',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.partnersService.findAll(paginationDto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas dos parceiros' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  getStats() {
    return this.partnersService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter um parceiro específico' })
  @ApiResponse({
    status: 200,
    description: 'Parceiro encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Parceiro não encontrado',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.partnersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Parceiro atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Parceiro não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está sendo usado por outro parceiro',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Parceiro excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Parceiro não encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.partnersService.remove(id);
  }
} 