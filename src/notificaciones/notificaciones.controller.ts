import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('notificaciones')
@Controller('notificaciones')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) { }

  @Get()
  @Permissions('lectura:caja-central')
  @ApiOperation({ summary: 'Notificaciones de la empresa con contador de no leídas' })
  findAll(@Request() req) {
    return this.notificacionesService.findAll(req.user.idEmpresa);
  }

  @Patch(':id/leer')
  @Permissions('lectura:caja-central')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  marcarLeida(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificacionesService.marcarLeida(id, req.user.idEmpresa);
  }
}
