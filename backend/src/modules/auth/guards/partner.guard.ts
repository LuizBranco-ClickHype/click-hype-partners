import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PartnersService } from '../../partners/partners.service';

@Injectable()
export class PartnerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private partnersService: PartnersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token);
      
      // Verificar se é um token de parceiro
      if (payload.role !== 'PARTNER') {
        throw new UnauthorizedException('Token inválido para parceiro');
      }

      // Verificar se o parceiro existe e está ativo
      const partner = await this.partnersService.findById(payload.sub);
      
      if (!partner || partner.status !== 'ACTIVE') {
        throw new UnauthorizedException('Parceiro inativo ou não encontrado');
      }

      // Adicionar informações do parceiro à requisição
      request.user = {
        partnerId: partner.id,
        email: partner.email,
        companyName: partner.companyName,
        role: 'PARTNER',
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 