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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { UpdateEstadoProductoDto } from './dto/update-estado-producto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Producto } from '../entities/producto.entity';

@ApiTags('productos')
@Controller('productos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @Permissions('escritura:producto')
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado', type: Producto })
  create(@Body() createProductoDto: CreateProductoDto, @Request() req) {
    return this.productosService.create(createProductoDto, req.user.idEmpresa);
  }

  @Get()
  @Permissions('lectura:producto')
  @ApiOperation({ summary: 'Listar todos los productos' })
  @ApiResponse({ status: 200, description: 'Lista de productos', type: [Producto] })
  findAll(@Request() req) {
    return this.productosService.findAll(req.user.idEmpresa);
  }

  @Get(':id')
  @Permissions('lectura:producto')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: Producto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productosService.findOne(id, req.user.idEmpresa);
  }

  @Patch(':id')
  @Permissions('escritura:producto')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: Producto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
    @Request() req,
  ) {
    return this.productosService.update(id, updateProductoDto, req.user.idEmpresa);
  }

  @Patch(':id/estado')
  @Permissions('escritura:producto')
  @ApiOperation({ summary: 'Cambiar el estado de un producto' })
  @ApiResponse({ status: 200, description: 'Estado actualizado', type: Producto })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoProductoDto,
    @Request() req,
  ) {
    return this.productosService.updateEstado(id, updateEstadoDto, req.user.idEmpresa);
  }

  @Delete(':id')
  @Permissions('escritura:producto')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productosService.remove(id, req.user.idEmpresa);
  }
}
