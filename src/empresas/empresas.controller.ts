import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('empresas')
@Controller('empresas')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class EmpresasController {
    constructor(private readonly empresasService: EmpresasService) { }

    @Get()
    @ApiOperation({ summary: 'Obtener todas las empresas' })
    @Permissions('lectura:empresas')
    findAll() {
        return this.empresasService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una empresa por ID' })
    @Permissions('lectura:empresas')
    findOne(@Param('id') id: string) {
        return this.empresasService.findOne(+id);
    }
}
