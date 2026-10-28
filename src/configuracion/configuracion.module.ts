import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionController } from './configuracion.controller';
import { ConfiguracionService } from './configuracion.service';
import { Empresa } from '../entities/empresa.entity';
import { PuntoVenta } from '../entities/punto-venta.entity';
import { CredencialesArca } from '../entities/credenciales-arca.entity';
import { AuthModule } from '../auth/auth.module';
import { FacturacionModule } from '../facturacion/facturacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, PuntoVenta, CredencialesArca]),
    AuthModule,
    FacturacionModule,
  ],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule { }
