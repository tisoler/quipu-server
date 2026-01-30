import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlmacenesService } from './almacenes.service';
import { AlmacenesController } from './almacenes.controller';
import { Almacen } from '../entities/almacen.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Almacen]), AuthModule],
  controllers: [AlmacenesController],
  providers: [AlmacenesService],
})
export class AlmacenesModule {}
