import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MovimientosService } from './movimientos.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { FilterMovimientoDto } from './dto/filter-movimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Movimiento } from '../entities/movimiento.entity';

@ApiTags('movimientos')
@Controller('movimientos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Post()
  @Permissions('escritura:movimiento')
  @ApiOperation({ summary: 'Crear un nuevo movimiento' })
  @ApiResponse({ status: 201, description: 'Movimiento creado', type: Movimiento })
  create(@Body() createMovimientoDto: CreateMovimientoDto, @Request() req) {
    return this.movimientosService.create(createMovimientoDto, req.user.idEmpresa, req.user.id);
  }

  @Get()
  @Permissions('lectura:movimiento')
  @ApiOperation({ summary: 'Listar movimientos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos paginada' })
  findAll(@Query() filters: FilterMovimientoDto, @Request() req) {
    return this.movimientosService.findAll(filters, req.user.idEmpresa);
  }

  @Get(':id')
  @Permissions('lectura:movimiento')
  @ApiOperation({ summary: 'Obtener un movimiento por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado', type: Movimiento })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.movimientosService.findOne(id, req.user.idEmpresa);
  }

  @Patch(':id')
  @Permissions('escritura:movimiento')
  @ApiOperation({ summary: 'Actualizar un movimiento' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado', type: Movimiento })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovimientoDto: UpdateMovimientoDto,
    @Request() req,
  ) {
    return this.movimientosService.update(id, updateMovimientoDto, req.user.idEmpresa);
  }

  @Delete(':id')
  @Permissions('escritura:movimiento')
  @ApiOperation({ summary: 'Eliminar un movimiento (borrado lógico)' })
  @ApiResponse({ status: 200, description: 'Movimiento eliminado', type: Movimiento })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.movimientosService.remove(id, req.user.idEmpresa);
  }
}
