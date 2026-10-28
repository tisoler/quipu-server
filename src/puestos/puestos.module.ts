import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuestosService } from './puestos.service';
import { PuestosController } from './puestos.controller';
import { CajaCentralController } from './caja-central.controller';
import { CajaPuesto } from '../entities/caja-puesto.entity';
import { CajaCentral } from '../entities/caja-central.entity';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { Venta } from '../entities/venta.entity';
import { Producto } from '../entities/producto.entity';
import { StockProducto } from '../entities/stock-producto.entity';
import { Almacen } from '../entities/almacen.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CajaPuesto,
      CajaCentral,
      MovimientoProducto,
      Venta,
      Producto,
      StockProducto,
      Almacen,
    ]),
    AuthModule,
  ],
  controllers: [PuestosController, CajaCentralController],
  providers: [PuestosService],
})
export class PuestosModule { }
