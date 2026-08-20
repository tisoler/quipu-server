import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubrosService } from './rubros.service';
import { RubrosController } from './rubros.controller';
import { Rubro } from '../entities/rubro.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Rubro]),
        AuthModule,
    ],
    controllers: [RubrosController],
    providers: [RubrosService],
    exports: [RubrosService],
})
export class RubrosModule { }
