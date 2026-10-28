import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { MaterialesModule } from './materiales/materiales.module';
import { AlmacenesModule } from './almacenes/almacenes.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { InventarioModule } from './inventario/inventario.module';
import { EmpresasModule } from './empresas/empresas.module';
import { Empresa } from './entities/empresa.entity';
import { Producto } from './entities/producto.entity';
import { Material } from './entities/material.entity';
import { Almacen } from './entities/almacen.entity';
import { MovimientoProducto } from './entities/movimiento-producto.entity';
import { MovimientoMaterial } from './entities/movimiento-material.entity';
import { StockProducto } from './entities/stock-producto.entity';
import { StockMaterial } from './entities/stock-material.entity';
import { Rubro } from './entities/rubro.entity';
import { RubrosModule } from './rubros/rubros.module';
import { CajaPuesto } from './entities/caja-puesto.entity';
import { CajaCentral } from './entities/caja-central.entity';
import { PuestosModule } from './puestos/puestos.module';
import { Proveedor } from './entities/proveedor.entity';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { Cliente } from './entities/cliente.entity';
import { PuntoVenta } from './entities/punto-venta.entity';
import { Venta } from './entities/venta.entity';
import { Comprobante } from './entities/comprobante.entity';
import { CredencialesArca } from './entities/credenciales-arca.entity';
import { TicketAcceso } from './entities/ticket-acceso.entity';
import { ClientesModule } from './clientes/clientes.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { SpacesModule } from './spaces/spaces.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Empresa,
          Producto,
          Material,
          Almacen,
          MovimientoProducto,
          MovimientoMaterial,
          StockProducto,
          StockMaterial,
          Rubro,
          CajaPuesto,
          CajaCentral,
          Proveedor,
          Notificacion,
          Cliente,
          PuntoVenta,
          Venta,
          Comprobante,
          CredencialesArca,
          TicketAcceso,
        ],

        synchronize: false, // Usar migraciones en producción
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ProductosModule,
    MaterialesModule,
    AlmacenesModule,
    MovimientosModule,
    InventarioModule,
    EmpresasModule,
    RubrosModule,
    PuestosModule,
    ProveedoresModule,
    NotificacionesModule,
    ClientesModule,
    ConfiguracionModule,
    FacturacionModule,
    SpacesModule,
  ],
})
export class AppModule { }
