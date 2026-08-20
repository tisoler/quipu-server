import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EmpresasModule } from '../empresas/empresas.module';
import { AuthController } from './auth.controller';
import { FirebaseStrategy } from './strategies/firebase.strategy';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'firebase' }),
    forwardRef(() => EmpresasModule),
  ],
  controllers: [AuthController],
  providers: [FirebaseStrategy, PermissionsGuard],
  exports: [PermissionsGuard],
})
export class AuthModule { }

