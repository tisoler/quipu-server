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
import { MaterialesService } from './materiales.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateEstadoMaterialDto } from './dto/update-estado-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Material } from '../entities/material.entity';

@ApiTags('materiales')
@Controller('materiales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MaterialesController {
  constructor(private readonly materialesService: MaterialesService) {}

  @Post()
  @Permissions('escritura:material')
  @ApiOperation({ summary: 'Crear un nuevo material' })
  @ApiResponse({ status: 201, description: 'Material creado', type: Material })
  create(@Body() createMaterialDto: CreateMaterialDto, @Request() req) {
    return this.materialesService.create(createMaterialDto, req.user.idEmpresa);
  }

  @Get()
  @Permissions('lectura:material')
  @ApiOperation({ summary: 'Listar todos los materiales' })
  @ApiResponse({ status: 200, description: 'Lista de materiales', type: [Material] })
  findAll(@Request() req) {
    return this.materialesService.findAll(req.user.idEmpresa);
  }

  @Get(':id')
  @Permissions('lectura:material')
  @ApiOperation({ summary: 'Obtener un material por ID' })
  @ApiResponse({ status: 200, description: 'Material encontrado', type: Material })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.materialesService.findOne(id, req.user.idEmpresa);
  }

  @Patch(':id')
  @Permissions('escritura:material')
  @ApiOperation({ summary: 'Actualizar un material' })
  @ApiResponse({ status: 200, description: 'Material actualizado', type: Material })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @Request() req,
  ) {
    return this.materialesService.update(id, updateMaterialDto, req.user.idEmpresa);
  }

  @Patch(':id/estado')
  @Permissions('escritura:material')
  @ApiOperation({ summary: 'Cambiar el estado de un material' })
  @ApiResponse({ status: 200, description: 'Estado actualizado', type: Material })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoMaterialDto,
    @Request() req,
  ) {
    return this.materialesService.updateEstado(id, updateEstadoDto, req.user.idEmpresa);
  }

  @Delete(':id')
  @Permissions('escritura:material')
  @ApiOperation({ summary: 'Eliminar un material' })
  @ApiResponse({ status: 200, description: 'Material eliminado' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.materialesService.remove(id, req.user.idEmpresa);
  }
}
