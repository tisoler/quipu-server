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
import { AlmacenesService } from './almacenes.service';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Almacen } from '../entities/almacen.entity';

@ApiTags('almacenes')
@Controller('almacenes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  @Post()
  @Permissions('escritura:almacen')
  @ApiOperation({ summary: 'Crear un nuevo almacén' })
  @ApiResponse({ status: 201, description: 'Almacén creado', type: Almacen })
  create(@Body() createAlmacenDto: CreateAlmacenDto, @Request() req) {
    return this.almacenesService.create(createAlmacenDto, req.user.idEmpresa);
  }

  @Get()
  @Permissions('lectura:almacen')
  @ApiOperation({ summary: 'Listar todos los almacenes' })
  @ApiResponse({ status: 200, description: 'Lista de almacenes', type: [Almacen] })
  findAll(@Request() req) {
    return this.almacenesService.findAll(req.user.idEmpresa);
  }

  @Get(':id')
  @Permissions('lectura:almacen')
  @ApiOperation({ summary: 'Obtener un almacén por ID' })
  @ApiResponse({ status: 200, description: 'Almacén encontrado', type: Almacen })
  @ApiResponse({ status: 404, description: 'Almacén no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.almacenesService.findOne(id, req.user.idEmpresa);
  }

  @Patch(':id')
  @Permissions('escritura:almacen')
  @ApiOperation({ summary: 'Actualizar un almacén' })
  @ApiResponse({ status: 200, description: 'Almacén actualizado', type: Almacen })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlmacenDto: UpdateAlmacenDto,
    @Request() req,
  ) {
    return this.almacenesService.update(id, updateAlmacenDto, req.user.idEmpresa);
  }

  @Delete(':id')
  @Permissions('escritura:almacen')
  @ApiOperation({ summary: 'Eliminar un almacén' })
  @ApiResponse({ status: 200, description: 'Almacén eliminado' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.almacenesService.remove(id, req.user.idEmpresa);
  }
}
