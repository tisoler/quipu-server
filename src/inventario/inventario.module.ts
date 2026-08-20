import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { MovimientoMaterial } from '../entities/movimiento-material.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { Almacen } from '../entities/almacen.entity';
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
      Almacen,
      StockProducto,
      StockMaterial
    ]),
    AuthModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule { }
