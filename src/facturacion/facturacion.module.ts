import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturacionController } from './facturacion.controller';
import { FacturacionService } from './facturacion.service';
import { PdfFacturaService } from './pdf.service';
import { WsaaService } from './wsaa.service';
import { WsfeService } from './wsfe.service';
import { TicketAccesoService } from './ticket-acceso.service';
import { Venta } from '../entities/venta.entity';
import { Comprobante } from '../entities/comprobante.entity';
import { CredencialesArca } from '../entities/credenciales-arca.entity';
import { Cliente } from '../entities/cliente.entity';
import { PuntoVenta } from '../entities/punto-venta.entity';
import { Empresa } from '../entities/empresa.entity';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { TicketAcceso } from '../entities/ticket-acceso.entity';
import { AuthModule } from '../auth/auth.module';
import { SpacesModule } from '../spaces/spaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      Comprobante,
      CredencialesArca,
      Cliente,
      PuntoVenta,
      Empresa,
      MovimientoProducto,
      TicketAcceso,
    ]),
    AuthModule,
    SpacesModule,
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService, PdfFacturaService, WsaaService, WsfeService, TicketAccesoService],
  exports: [FacturacionService, PdfFacturaService, WsaaService, TicketAccesoService],
})
export class FacturacionModule { }
