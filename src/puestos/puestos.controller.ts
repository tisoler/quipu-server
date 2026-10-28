import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PuestosService } from './puestos.service';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { RegistrarVentasDto } from './dto/registrar-ventas.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { FilterCajaDto } from './dto/filter-caja.dto';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('puestos')
@Controller('puestos')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class PuestosController {
  constructor(private readonly puestosService: PuestosService) { }

  @Get('mi-caja')
  @Permissions('lectura:puesto-venta')
  @ApiOperation({ summary: 'Caja actual del vendedor (abierta o última cerrada) con sus ventas' })
  @ApiResponse({ status: 200, description: 'Caja del vendedor' })
  miCaja(@Request() req) {
    return this.puestosService.miCaja(req.user.id, req.user.idEmpresa);
  }

  @Post('abrir')
  @Permissions('escritura:puesto-venta')
  @ApiOperation({ summary: 'Abrir una caja nueva para el día' })
  @ApiResponse({ status: 201, description: 'Caja abierta (o devuelta si ya estaba abierta)' })
  @ApiResponse({ status: 409, description: 'El vendedor ya cerró una caja hoy' })
  abrir(@Body() dto: AbrirCajaDto, @Request() req) {
    return this.puestosService.abrirCaja(dto, req.user.id, req.user.nombreUsuario, req.user.idEmpresa);
  }

  @Get('productos')
  @Permissions('lectura:puesto-venta')
  @ApiOperation({ summary: 'Buscar productos con stock del puesto y stock general' })
  @ApiResponse({ status: 200, description: 'Productos con stock' })
  buscarProductos(@Query('idCaja', ParseIntPipe) idCaja: number, @Query('search') search: string, @Request() req) {
    return this.puestosService.buscarProductos(idCaja, search, req.user.id, req.user.idEmpresa);
  }

  @Delete('ventas/:idMovimiento')
  @Permissions('escritura:puesto-venta')
  @ApiOperation({ summary: 'Anular una venta de la propia caja abierta' })
  @ApiResponse({ status: 200, description: 'Venta anulada y stock repuesto' })
  anularVenta(@Param('idMovimiento', ParseIntPipe) idMovimiento: number, @Request() req) {
    return this.puestosService.anularVenta(idMovimiento, req.user.id, req.user.idEmpresa);
  }

  @Post(':id/ventas')
  @Permissions('escritura:puesto-venta')
  @ApiOperation({ summary: 'Registrar las ventas del carrito en la caja' })
  @ApiResponse({ status: 201, description: 'Ventas registradas' })
  registrarVentas(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarVentasDto,
    @Request() req,
  ) {
    return this.puestosService.registrarVentas(id, dto, req.user.id, req.user.nombreUsuario, req.user.idEmpresa);
  }

  @Post(':id/cerrar')
  @Permissions('escritura:puesto-venta')
  @ApiOperation({ summary: 'Cerrar la caja con arqueo y transferir a caja central' })
  @ApiResponse({ status: 201, description: 'Caja cerrada' })
  cerrar(@Param('id', ParseIntPipe) id: number, @Body() dto: CerrarCajaDto, @Request() req) {
    return this.puestosService.cerrarCaja(id, dto, req.user.id, req.user.nombreUsuario, req.user.idEmpresa);
  }

  @Get()
  @Permissions('lectura:caja-central')
  @ApiOperation({ summary: 'Listar cajas (administración)' })
  @ApiResponse({ status: 200, description: 'Lista de cajas paginada' })
  findAll(@Query() filters: FilterCajaDto, @Request() req) {
    return this.puestosService.findAllCajas(filters, req.user.idEmpresa);
  }

  @Get(':id')
  @Permissions('lectura:puesto-venta')
  @ApiOperation({ summary: 'Detalle de una caja con sus ventas (dueño o perfil caja central)' })
  @ApiResponse({ status: 200, description: 'Caja con ventas' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.puestosService.findOneCaja(id, req.user.idEmpresa, { id: req.user.id, permisos: req.user.permisos });
  }

  @Patch(':id/reabrir')
  @Permissions('escritura:caja-central')
  @ApiOperation({ summary: 'Rehabilitar una caja cerrada (solo administración)' })
  @ApiResponse({ status: 200, description: 'Caja reabierta' })
  reabrir(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.puestosService.reabrirCaja(id, req.user.idEmpresa);
  }
}
