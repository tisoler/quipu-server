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
import { RubrosService } from './rubros.service';
import { CreateRubroDto } from './dto/create-rubro.dto';
import { UpdateRubroDto } from './dto/update-rubro.dto';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('rubros')
@Controller('rubros')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class RubrosController {
    constructor(private readonly rubrosService: RubrosService) { }

    @Get()
    @Permissions('lectura:rubro')
    @ApiOperation({ summary: 'Obtener todos los rubros de la empresa' })
    findAll(@Request() req) {
        return this.rubrosService.findAll(req.user.idEmpresa);
    }

    @Get(':id')
    @Permissions('lectura:rubro')
    @ApiOperation({ summary: 'Obtener un rubro por ID' })
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.rubrosService.findOne(id, req.user.idEmpresa);
    }

    @Post()
    @Permissions('escritura:rubro')
    @ApiOperation({ summary: 'Crear un nuevo rubro' })
    create(@Body() createRubroDto: CreateRubroDto, @Request() req) {
        return this.rubrosService.create(createRubroDto, req.user.idEmpresa);
    }

    @Patch(':id')
    @Permissions('escritura:rubro')
    @ApiOperation({ summary: 'Actualizar un rubro por ID' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRubroDto: UpdateRubroDto,
        @Request() req,
    ) {
        return this.rubrosService.update(id, updateRubroDto, req.user.idEmpresa);
    }

    @Delete(':id')
    @Permissions('escritura:rubro')
    @ApiOperation({ summary: 'Eliminar un rubro por ID' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.rubrosService.remove(id, req.user.idEmpresa);
    }
}
