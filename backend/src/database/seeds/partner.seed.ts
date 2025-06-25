import { DataSource } from 'typeorm';
import { Partner, PartnerStatus } from '../../modules/partners/entities/partner.entity';

export async function seedPartner(dataSource: DataSource) {
  const partnerRepository = dataSource.getRepository(Partner);

  // Check if test partner already exists
  const existingPartner = await partnerRepository.findOne({
    where: { email: 'partner@test.com' },
  });

  if (existingPartner) {
    console.log('Test partner already exists');
    return;
  }

  // Create test partner
  const testPartner = partnerRepository.create({
    companyName: 'Empresa Teste LTDA',
    email: 'partner@test.com',
    password: 'partner123', // Will be hashed automatically by the entity
    phone: '(11) 99999-9999',
    document: '12.345.678/0001-99',
    commissionPercentage: 10.00,
    status: PartnerStatus.ACTIVE,
    description: 'Parceiro de teste para desenvolvimento',
    website: 'https://empresateste.com.br',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
  });

  await partnerRepository.save(testPartner);

  console.log('Test partner created successfully!');
  console.log('Email: partner@test.com');
  console.log('Password: partner123');
} 