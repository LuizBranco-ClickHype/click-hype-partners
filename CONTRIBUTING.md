# 🤝 Guia de Contribuição - Click Hype Partners

## 📋 Índice

1. [Como Contribuir](#como-contribuir)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Convenções de Código](#convenções-de-código)
4. [Fluxo de Trabalho Git](#fluxo-de-trabalho-git)
5. [Testes](#testes)
6. [Pull Requests](#pull-requests)
7. [Reportar Issues](#reportar-issues)

---

## 🚀 Como Contribuir

Agradecemos seu interesse em contribuir com o projeto Click Hype Partners! Este guia irá ajudá-lo a começar.

### Tipos de Contribuição

- 🐛 **Bug Reports**: Relatar problemas encontrados
- ✨ **Feature Requests**: Sugerir novas funcionalidades
- 🔧 **Bug Fixes**: Corrigir problemas existentes
- 📚 **Documentação**: Melhorar ou adicionar documentação
- 🧪 **Testes**: Adicionar ou melhorar testes
- ⚡ **Performance**: Otimizações de performance

---

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- **Node.js**: 18.x ou superior
- **Docker**: 20.x ou superior
- **Docker Compose**: 2.x ou superior
- **Git**: 2.x ou superior

### Instalação

1. **Fork o repositório**
```bash
# Clique em "Fork" no GitHub
```

2. **Clone seu fork**
```bash
git clone https://github.com/SEU_USERNAME/click-hype-partners.git
cd click-hype-partners
```

3. **Adicione o repositório original como upstream**
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/click-hype-partners.git
```

4. **Configure o ambiente**
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Configure as variáveis necessárias
nano .env
```

5. **Inicie os serviços**
```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# OU produção local
docker-compose up -d
```

6. **Verifique a instalação**
```bash
# Backend
curl http://localhost:3001/api/v1/health

# Frontend
curl http://localhost:3000
```

---

## 📝 Convenções de Código

### Estrutura de Arquivos

```
projeto/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   └── [nome-modulo]/
│   │   │       ├── dto/
│   │   │       ├── entities/
│   │   │       ├── guards/
│   │   │       ├── [nome].controller.ts
│   │   │       ├── [nome].service.ts
│   │   │       ├── [nome].module.ts
│   │   │       └── [nome].service.spec.ts
│   │   ├── config/
│   │   ├── shared/
│   │   └── main.ts
│   └── test/
└── frontend/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── services/
    │   └── types/
    └── __tests__/
```

### Naming Conventions

#### Backend (NestJS)

- **Classes**: PascalCase
  ```typescript
  export class UsersController {}
  export class CreateUserDto {}
  ```

- **Métodos e Variáveis**: camelCase
  ```typescript
  async findUserById(id: string) {}
  const userRepository = this.userRepo;
  ```

- **Arquivos**: kebab-case
  ```
  users.controller.ts
  create-user.dto.ts
  user.entity.ts
  ```

- **Constantes**: UPPER_SNAKE_CASE
  ```typescript
  const MAX_RETRY_ATTEMPTS = 3;
  const DEFAULT_PAGE_SIZE = 10;
  ```

#### Frontend (Next.js)

- **Componentes**: PascalCase
  ```typescript
  export default function UserProfile() {}
  export const LoginForm = () => {}
  ```

- **Hooks**: camelCase com prefixo 'use'
  ```typescript
  const useUserData = () => {}
  const useApiCall = () => {}
  ```

- **Arquivos de Componentes**: PascalCase
  ```
  UserProfile.tsx
  LoginForm.tsx
  ```

- **Outros arquivos**: camelCase
  ```
  apiClient.ts
  userService.ts
  ```

### Formatação de Código

#### ESLint e Prettier

O projeto usa ESLint e Prettier para formatação automática:

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
```

#### Configurações Importantes

- **Indentação**: 2 espaços
- **Quotes**: Single quotes para strings
- **Semicolons**: Obrigatórios
- **Trailing Commas**: Sempre
- **Line Length**: 100 caracteres

### Estrutura de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

#### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta lógica)
- `refactor`: Refatoração de código
- `test`: Adição/modificação de testes
- `chore`: Tarefas de manutenção
- `perf`: Melhorias de performance
- `ci`: Mudanças na CI/CD

#### Exemplos

```bash
feat(auth): implementar autenticação JWT
fix(users): corrigir validação de email
docs(api): adicionar documentação do endpoint de usuários
test(auth): adicionar testes unitários para login
refactor(database): otimizar consultas de clientes
```

---

## 🌿 Fluxo de Trabalho Git

### Branches

#### Estrutura de Branches

- `main`: Branch principal (produção)
- `develop`: Branch de desenvolvimento
- `feature/[nome]`: Novas funcionalidades
- `fix/[nome]`: Correções de bugs
- `hotfix/[nome]`: Correções urgentes
- `release/[versao]`: Preparação de releases

#### Workflow

1. **Sincronizar com upstream**
```bash
git checkout main
git pull upstream main
git push origin main
```

2. **Criar branch para desenvolvimento**
```bash
git checkout -b feature/nova-funcionalidade
```

3. **Fazer commits seguindo convenções**
```bash
git add .
git commit -m "feat(users): adicionar endpoint de criação de usuário"
```

4. **Push para seu fork**
```bash
git push origin feature/nova-funcionalidade
```

5. **Criar Pull Request**

### Rebase vs Merge

- Use **rebase** para branches de feature pequenas
- Use **merge** para branches de feature grandes ou releases

```bash
# Rebase
git rebase main

# Merge
git merge --no-ff feature/nova-funcionalidade
```

---

## 🧪 Testes

### Tipos de Teste

#### Backend

1. **Testes Unitários**
```bash
cd backend
npm run test
```

2. **Testes de Integração**
```bash
npm run test:e2e
```

3. **Cobertura de Código**
```bash
npm run test:cov
```

#### Frontend

1. **Testes de Componente**
```bash
cd frontend
npm run test
```

2. **Testes E2E**
```bash
npm run test:e2e
```

### Estrutura de Testes

#### Backend (Jest)

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '1';
      const expectedUser = { id: userId, name: 'Test User' };
      repository.findOne = jest.fn().mockResolvedValue(expectedUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
    });
  });
});
```

#### Frontend (React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Cobertura Mínima

- **Backend**: 80% de cobertura
- **Frontend**: 70% de cobertura

---

## 📬 Pull Requests

### Antes de Criar um PR

- [ ] Código está formatado (ESLint/Prettier)
- [ ] Testes passam localmente
- [ ] Documentação foi atualizada
- [ ] Commits seguem convenções
- [ ] Branch está atualizada com main

### Template de PR

```markdown
## 📝 Descrição

Breve descrição das mudanças realizadas.

## 🔗 Issue Relacionada

Fixes #123

## 🧪 Tipo de Mudança

- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## ✅ Checklist

- [ ] Testes passam localmente
- [ ] Código foi revisado por mim
- [ ] Documentação atualizada
- [ ] Não há conflitos com main

## 📸 Screenshots (se aplicável)

Adicione screenshots para mudanças visuais.

## 🧪 Como Testar

1. Passo 1
2. Passo 2
3. Resultado esperado
```

### Review Process

1. **Automated Checks**: CI/CD deve passar
2. **Code Review**: Pelo menos 1 aprovação
3. **Testing**: Testes manuais se necessário
4. **Merge**: Squash and merge para features

---

## 🐛 Reportar Issues

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug

Descrição clara e concisa do problema.

## 🔄 Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

## ✅ Comportamento Esperado

O que deveria acontecer.

## 📸 Screenshots

Se aplicável, adicione screenshots.

## 🖥️ Ambiente

- OS: [e.g. Ubuntu 20.04]
- Browser: [e.g. Chrome 91]
- Node.js: [e.g. 18.17.0]
- Docker: [e.g. 20.10.17]

## 📝 Informações Adicionais

Qualquer outra informação relevante.
```

### Template de Feature Request

```markdown
## 🚀 Descrição da Funcionalidade

Descrição clara da funcionalidade desejada.

## 💡 Motivação

Por que esta funcionalidade é necessária?

## 📋 Critérios de Aceitação

- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 🎨 Mockups/Wireframes

Se aplicável, adicione imagens.

## 📝 Informações Adicionais

Contexto adicional ou alternativas consideradas.
```

---

## 📞 Suporte

### Canais de Comunicação

- **Issues**: Para bugs e feature requests
- **Discussions**: Para perguntas gerais
- **Email**: dev@clickhype.com (para questões sensíveis)

### Horários de Resposta

- **Issues**: 24-48 horas
- **Pull Requests**: 24-72 horas
- **Email**: 1-3 dias úteis

---

## 🏆 Reconhecimento

Contribuidores são reconhecidos através de:

- **README Contributors**: Lista de contribuidores
- **Release Notes**: Menção em releases
- **GitHub Achievements**: Badges e conquistas

---

## 📜 Código de Conduta

Este projeto segue o [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).

### Resumo

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Demonstre empatia com outros membros

---

**🙏 Obrigado por contribuir com o Click Hype Partners!**

*Última atualização: 25/06/2025* 