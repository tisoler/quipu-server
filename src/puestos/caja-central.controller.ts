import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PuestosService } from './puestos.service';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('caja-central')
@Controller('caja-central')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class CajaCentralController {
  constructor(private readonly puestosService: PuestosService) { }

  @Get()
  @Permissions('lectura:caja-central')
  @ApiOperation({ summary: 'Saldo y movimientos de la caja central' })
  @ApiResponse({ status: 200, description: 'Saldo y movimientos' })
  findAll(@Request() req) {
    return this.puestosService.cajaCentral(req.user.idEmpresa);
  }
}
