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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('proveedores')
@Controller('proveedores')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) { }

  @Get()
  @Permissions('lectura:proveedor')
  @ApiOperation({ summary: 'Obtener todos los proveedores de la empresa' })
  findAll(@Request() req) {
    return this.proveedoresService.findAll(req.user.idEmpresa);
  }

  @Get(':id')
  @Permissions('lectura:proveedor')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.proveedoresService.findOne(id, req.user.idEmpresa);
  }

  @Post()
  @Permissions('escritura:proveedor')
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  create(@Body() dto: CreateProveedorDto, @Request() req) {
    return this.proveedoresService.create(dto, req.user.idEmpresa);
  }

  @Patch(':id')
  @Permissions('escritura:proveedor')
  @ApiOperation({ summary: 'Actualizar un proveedor por ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
    @Request() req,
  ) {
    return this.proveedoresService.update(id, dto, req.user.idEmpresa);
  }

  @Delete(':id')
  @Permissions('escritura:proveedor')
  @ApiOperation({ summary: 'Eliminar un proveedor por ID' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.proveedoresService.remove(id, req.user.idEmpresa);
  }
}
