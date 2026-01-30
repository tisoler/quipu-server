import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { FilterInventarioDto } from './dto/filter-inventario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('inventario')
@Controller('inventario')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('grafico')
  @Permissions('lectura:inventario')
  @ApiOperation({ summary: 'Obtener datos para gráfico de inventario' })
  @ApiResponse({ status: 200, description: 'Datos del gráfico' })
  getDatosGrafico(@Query() filters: FilterInventarioDto, @Request() req) {
    return this.inventarioService.getDatosGrafico(filters, req.user.idEmpresa);
  }

  @Get('articulos')
  @Permissions('lectura:inventario')
  @ApiOperation({ summary: 'Obtener artículos disponibles para filtros' })
  @ApiResponse({ status: 200, description: 'Lista de artículos' })
  getArticulos(@Query('tipoArticulo') tipoArticulo: string, @Request() req) {
    return this.inventarioService.getArticulosDisponibles(tipoArticulo, req.user.idEmpresa);
  }

  @Get('almacenes')
  @Permissions('lectura:inventario')
  @ApiOperation({ summary: 'Obtener almacenes disponibles para filtros' })
  @ApiResponse({ status: 200, description: 'Lista de almacenes' })
  getAlmacenes(@Request() req) {
    return this.inventarioService.getAlmacenesDisponibles(req.user.idEmpresa);
  }
}
