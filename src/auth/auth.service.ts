import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioRol } from '../entities/usuario-rol.entity';
import { RolPermisos } from '../entities/rol-permisos.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(UsuarioRol)
    private usuarioRolRepository: Repository<UsuarioRol>,
    @InjectRepository(RolPermisos)
    private rolPermisosRepository: Repository<RolPermisos>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(nombreUsuario: string, password: string): Promise<any> {
    const usuario = await this.usuarioRepository.findOne({
      where: { nombreUsuario },
      relations: ['empresa'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password: _, ...result } = usuario;
    return result;
  }

  async validateUserById(userId: number): Promise<any> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['empresa'],
    });

    if (!usuario) {
      return null;
    }

    const { password: _, ...result } = usuario;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.nombreUsuario, loginDto.password);

    const payload = {
      sub: user.id,
      nombreUsuario: user.nombreUsuario,
      idEmpresa: user.idEmpresa,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombreUsuario: user.nombreUsuario,
        idEmpresa: user.idEmpresa,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.validateUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const newPayload = {
        sub: user.id,
        nombreUsuario: user.nombreUsuario,
        idEmpresa: user.idEmpresa,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async hasPermission(userId: number, empresaId: number, permission: string): Promise<boolean> {
    const usuarioRoles = await this.usuarioRolRepository.find({
      where: {
        idUsuario: userId,
        idEmpresa: empresaId,
      },
      relations: ['rol'],
    });

    if (usuarioRoles.length === 0) {
      return false;
    }

    const rolIds = usuarioRoles.map((ur) => ur.idRol);

    const rolPermisos = await this.rolPermisosRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.permiso', 'p')
      .where('rp.idRol IN (:...rolIds)', { rolIds })
      .andWhere('rp.idEmpresa = :empresaId', { empresaId })
      .andWhere('p.nombre = :permission', { permission })
      .getOne();

    return !!rolPermisos;
  }
}
