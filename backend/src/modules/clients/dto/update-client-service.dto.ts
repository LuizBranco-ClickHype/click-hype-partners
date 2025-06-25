import { PartialType } from '@nestjs/swagger';
import { CreateClientServiceDto } from './create-client-service.dto';

export class UpdateClientServiceDto extends PartialType(CreateClientServiceDto) {} 