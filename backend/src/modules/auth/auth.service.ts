import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PartnersService } from '../partners/partners.service';
import { User } from '../users/entities/user.entity';
import { Partner } from '../partners/entities/partner.entity';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private partnersService: PartnersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await user.validatePassword(password)) {
      return user;
    }
    
    return null;
  }

  async validatePartner(email: string, password: string): Promise<Partner | null> {
    const partner = await this.partnersService.findByEmail(email);
    
    if (partner && partner.password && await partner.validatePassword(password)) {
      return partner;
    }
    
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async partnerLogin(loginDto: LoginDto) {
    const partner = await this.validatePartner(loginDto.email, loginDto.password);
    
    if (!partner) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (partner.status !== 'ACTIVE') {
      throw new UnauthorizedException('Parceiro inativo');
    }

    const payload: JwtPayload = {
      sub: partner.id,
      email: partner.email,
      role: 'PARTNER',
    };

    return {
      access_token: this.jwtService.sign(payload),
      partner: {
        id: partner.id,
        companyName: partner.companyName,
        email: partner.email,
        status: partner.status,
        commissionPercentage: partner.commissionPercentage,
      },
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Token inválido');
    }
    
    return user;
  }
} 