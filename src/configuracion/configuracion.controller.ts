import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguracionService } from './configuracion.service';
import { UpdateEmpresaFiscalDto, CreatePuntoVentaDto, UpdatePuntoVentaDto } from './dto/configuracion.dto';
import { GuardarCredencialesArcaDto, ProbarConexionDto } from './dto/credenciales.dto';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('configuracion')
@Controller('configuracion')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) { }

  @Get('empresa')
  @Permissions('lectura:configuracion')
  @ApiOperation({ summary: 'Datos fiscales de la empresa' })
  getEmpresa(@Request() req) {
    return this.configuracionService.getEmpresa(req.user.idEmpresa);
  }

  @Patch('empresa')
  @Permissions('escritura:configuracion')
  @ApiOperation({ summary: 'Actualizar datos fiscales de la empresa' })
  updateEmpresa(@Body() dto: UpdateEmpresaFiscalDto, @Request() req) {
    return this.configuracionService.updateEmpresa(req.user.idEmpresa, dto);
  }

  @Get('puntos-venta')
  @Permissions('lectura:configuracion')
  @ApiOperation({ summary: 'Listar puntos de venta' })
  listarPuntosVenta(@Request() req) {
    return this.configuracionService.listarPuntosVenta(req.user.idEmpresa);
  }

  @Post('puntos-venta')
  @Permissions('escritura:configuracion')
  @ApiOperation({ summary: 'Crear punto de venta' })
  crearPuntoVenta(@Body() dto: CreatePuntoVentaDto, @Request() req) {
    return this.configuracionService.crearPuntoVenta(req.user.idEmpresa, dto);
  }

  @Patch('puntos-venta/:id')
  @Permissions('escritura:configuracion')
  @ApiOperation({ summary: 'Actualizar punto de venta' })
  actualizarPuntoVenta(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePuntoVentaDto, @Request() req) {
    return this.configuracionService.actualizarPuntoVenta(id, req.user.idEmpresa, dto);
  }

  @Delete('puntos-venta/:id')
  @Permissions('escritura:configuracion')
  @ApiOperation({ summary: 'Eliminar punto de venta' })
  eliminarPuntoVenta(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.configuracionService.eliminarPuntoVenta(id, req.user.idEmpresa);
  }

  @Get('arca')
  @Permissions('lectura:configuracion')
  @ApiOperation({ summary: 'Estado de credenciales ARCA (sin secretos)' })
  getCredenciales(@Request() req) {
    return this.configuracionService.getCredenciales(req.user.idEmpresa);
  }

  @Post('arca')
  @Permissions('escritura:configuracion')
  @ApiOperation({ summary: 'Cargar certificado y clave privada ARCA' })
  guardarCredenciales(@Body() dto: GuardarCredencialesArcaDto, @Request() req) {
    return this.configuracionService.guardarCredenciales(req.user.idEmpresa, dto);
  }

  @Post('arca/probar')
  @Permissions('escritura:configuracion')
  @ApiOperation({ summary: 'Probar conexión con ARCA (WSAA)' })
  probarConexion(@Body() dto: ProbarConexionDto, @Request() req) {
    return this.configuracionService.probarConexion(req.user.idEmpresa, dto);
  }
}
