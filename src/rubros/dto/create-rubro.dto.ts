import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRubroDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsOptional()
    descripcion?: string;
}
