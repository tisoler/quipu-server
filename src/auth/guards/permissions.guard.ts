import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Ya no llamamos al authService porque los permisos ya fueron cargados 
    // desde Firestore en el FirebaseStrategy y están en el objeto user de la request.
    const hasPermission = user.permisos?.includes(requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException(`No tiene permiso: ${requiredPermission}`);
    }

    return true;
  }
}
