import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { Partner, PartnerStatus } from '../../modules/partners/entities/partner.entity';

export async function seedAdmin() {
  // Configuração do DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'clickhype_user',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'clickhype_partners_db',
    entities: [User, Partner],
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexão com banco estabelecida');

    const userRepository = dataSource.getRepository(User);
    const partnerRepository = dataSource.getRepository(Partner);

    // Verificar se já existe um admin
    const existingAdmin = await userRepository.findOne({
      where: { email: process.env.ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('⚠️  Usuário administrador já existe');
    } else {
      // Criar usuário administrador
      const admin = userRepository.create({
        name: 'Administrador',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD, // Será hasheado automaticamente
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      });

      await userRepository.save(admin);

      console.log('🎉 Usuário administrador criado com sucesso!');
      console.log(`📧 Email: ${process.env.ADMIN_EMAIL}`);
    }

    // Verificar se já existe um parceiro de teste
    const existingPartner = await partnerRepository.findOne({
      where: { email: 'partner@test.com' },
    });

    if (existingPartner) {
      console.log('⚠️  Parceiro de teste já existe');
    } else {
      // Criar parceiro de teste
      const testPartner = partnerRepository.create({
        companyName: 'Empresa Teste LTDA',
        email: 'partner@test.com',
        password: 'partner123', // Será hasheado automaticamente
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

      console.log('🎉 Parceiro de teste criado com sucesso!');
      console.log('📧 Email: partner@test.com');
      console.log('🔑 Senha: partner123');
    }

  } catch (error) {
    console.error('❌ Erro ao criar dados de seed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('✅ Seed executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no seed:', error);
      process.exit(1);
    });
} 