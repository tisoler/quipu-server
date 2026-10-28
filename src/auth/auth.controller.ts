import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseGuard } from './guards/firebase.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

  @Get('me')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  async getMe(@Request() req) {
    const user = req.user;

    // Devolver el perfil formateado con datos que ahora vienen de Firestore
    return {
      id: user.id,
      nombreUsuario: user.nombreUsuario,
      idEmpresa: user.idEmpresa,
      nombreEmpresa: user.nombreEmpresa,
      condicionIvaEmpresa: user.condicionIvaEmpresa || null,
      permisos: user.permisos || [],
      roles: user.roles || [],
    };
  }
}

