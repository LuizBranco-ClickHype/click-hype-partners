import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientServiceDto } from './dto/create-client-service.dto';
import { UpdateClientServiceDto } from './dto/update-client-service.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PartnerGuard } from '../auth/guards/partner.guard';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(PartnerGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  create(@Body() createClientDto: CreateClientDto, @Req() req: any) {
    return this.clientsService.create(createClientDto, req.user.partnerId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes do parceiro' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(@Query() paginationDto: PaginationDto, @Req() req: any) {
    return this.clientsService.findAll(req.user.partnerId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user.partnerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, updateClientDto, req.user.partnerId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente deletado com sucesso' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.remove(id, req.user.partnerId);
  }

  // Client Services endpoints
  @Post(':clientId/services')
  @ApiOperation({ summary: 'Adicionar serviço ao cliente' })
  @ApiResponse({ status: 201, description: 'Serviço adicionado com sucesso' })
  createService(
    @Param('clientId') clientId: string,
    @Body() createServiceDto: CreateClientServiceDto,
    @Req() req: any,
  ) {
    return this.clientsService.createService(
      clientId,
      createServiceDto,
      req.user.partnerId,
    );
  }

  @Patch('services/:serviceId')
  @ApiOperation({ summary: 'Atualizar serviço do cliente' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  updateService(
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: UpdateClientServiceDto,
    @Req() req: any,
  ) {
    return this.clientsService.updateService(
      serviceId,
      updateServiceDto,
      req.user.partnerId,
    );
  }

  @Delete('services/:serviceId')
  @ApiOperation({ summary: 'Remover serviço do cliente' })
  @ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
  removeService(@Param('serviceId') serviceId: string, @Req() req: any) {
    return this.clientsService.removeService(serviceId, req.user.partnerId);
  }
} 