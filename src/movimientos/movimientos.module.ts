import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosService } from './movimientos.service';
import { MovimientosController } from './movimientos.controller';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { MovimientoMaterial } from '../entities/movimiento-material.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { StockProducto } from '../entities/stock-producto.entity';
import { StockMaterial } from '../entities/stock-material.entity';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovimientoProducto,
      MovimientoMaterial,
      Producto,
      Material,
      StockProducto,
      StockMaterial
    ]),

    AuthModule,
  ],
  controllers: [MovimientosController],
  providers: [MovimientosService],
})
export class MovimientosModule { }
