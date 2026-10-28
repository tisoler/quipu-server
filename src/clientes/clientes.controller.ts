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
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('clientes')
@Controller('clientes')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) { }

  @Get()
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Buscar clientes de la empresa' })
  findAll(@Request() req, @Query('search') search?: string) {
    return this.clientesService.findAll(req.user.idEmpresa, search);
  }

  @Get(':id')
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.clientesService.findOne(id, req.user.idEmpresa);
  }

  @Post()
  @Permissions('escritura:facturacion')
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  create(@Body() dto: CreateClienteDto, @Request() req) {
    return this.clientesService.create(dto, req.user.idEmpresa);
  }

  @Patch(':id')
  @Permissions('escritura:facturacion')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto, @Request() req) {
    return this.clientesService.update(id, dto, req.user.idEmpresa);
  }

  @Delete(':id')
  @Permissions('escritura:facturacion')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.clientesService.remove(id, req.user.idEmpresa);
  }
}
