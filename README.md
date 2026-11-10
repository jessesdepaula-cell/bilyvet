# BilyVet

Plataforma SaaS de gestão para clínicas veterinárias, hospitais veterinários, pet shops e banho e tosa.

Visual limpo, moderno e amigável (azul + laranja + branco), com módulos de **atendimento, financeiro, cadastros, estoque, relatórios, agenda, vendas, pacotes, internação, fidelidade, exames e dashboards estratégicos**.

> O sistema **não integra** com Vet Smart. O receituário é interno e gerado pelo próprio BilyVet em PDF.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + componentes próprios
- **Prisma ORM** + **SQLite** (basta `npm install`)
- **Recharts** para gráficos
- **jsPDF** para receituário em PDF
- **JWT** (jose) + cookies HTTP-only para autenticação

## Como rodar localmente

Pré-requisitos: **Node 18+** e npm.

```bash
cd bilyvet
npm install
npm run db:reset    # cria/zera o banco SQLite e roda o seed
npm run dev
```

Abra http://localhost:3000

### Login

O comando `npm run db:reset` cria contas de demonstração para cada perfil (administrador, gestor, veterinário, recepção, financeiro, estoque, banho e tosa, vendedor). Veja os dados em `prisma/seed.ts`.

## Scripts

```bash
npm run dev          # ambiente de desenvolvimento
npm run build        # build de produção
npm run start        # iniciar build de produção
npm run db:push      # aplicar schema no SQLite
npm run db:seed      # popular dados de exemplo
npm run db:reset     # zerar e popular
```

## Estrutura

```
bilyvet/
├── prisma/
│   ├── schema.prisma     # 30+ modelos cobrindo todo o domínio
│   └── seed.ts           # dados realistas: tutores, pets, produtos, agenda, vendas, internação...
├── src/
│   ├── app/
│   │   ├── login/                  # autenticação
│   │   ├── (app)/                  # área autenticada
│   │   │   ├── dashboard/          # KPIs, gráficos e atalhos
│   │   │   ├── tutores/  pets/     # CRUDs com histórico
│   │   │   ├── produtos/           # CRUD de produtos
│   │   │   ├── agenda/             # diária/semanal, filtros, navegação
│   │   │   ├── atendimento/        # ficha clínica + receituário PDF
│   │   │   ├── esteira/            # kanban com drag & drop
│   │   │   ├── internacao/         # leitos, evoluções, alta
│   │   │   ├── exames/             # solicitação e resultados
│   │   │   ├── vendas/             # POS / vendas
│   │   │   ├── pacotes/            # pacotes de banho/serviço
│   │   │   ├── fidelidade/         # pontos
│   │   │   ├── financeiro/         # visão consolidada + DRE
│   │   │   ├── caixa/              # abertura, fechamento, sangrias
│   │   │   ├── contas-pagar/  contas-receber/
│   │   │   ├── estoque/  transferencias/  inventario/
│   │   │   ├── relatorios/         # com exportação CSV
│   │   │   ├── usuarios/  unidades/  configuracoes/  suporte/
│   │   └── api/                    # rotas REST de cada entidade
│   ├── components/                 # Sidebar, Topbar, StatCard, charts...
│   ├── lib/                        # db, auth, permissions, utils
│   └── middleware.ts               # proteção de rotas
└── tailwind.config.ts
```

## Módulos

1. **Dashboard** com KPIs, gráficos (Recharts) e atalhos.
2. **Cadastros**: tutores, pets, produtos, serviços, fornecedores, formas de pagamento, máquinas de cartão, regras de comissão.
3. **Atendimento** com ficha completa (queixa, anamnese, exame físico, diagnóstico, conduta, procedimentos, retorno) e **receituário interno em PDF**.
4. **Agenda** com visualização diária e semanal, filtros e navegação por período.
5. **Esteira** estilo kanban (Aguardando → Recepção → Triagem → Em consulta → Exames → Banho/Tosa → Internação → Pagamento → Finalizado) com **drag and drop** e tempo na etapa.
6. **Internação**: leitos, evoluções clínicas, sinais vitais, medicações e alta/óbito.
7. **Financeiro** com caixa diário, sangrias/suprimentos, contas a pagar, contas a receber, fluxo, DRE simplificado e mix de pagamentos.
8. **Vendas (POS)** com produtos, serviços, múltiplas formas de pagamento, descontos, acréscimos, baixa automática de estoque e pontos de fidelidade.
9. **Estoque** com múltiplas unidades, mínimo, validade, transferências, movimentações (entrada, saída, perda, ajuste, devolução, XML, transferência) e inventário valorizado.
10. **Relatórios** com curva ABC de clientes, top itens, estoque baixo, validade, receita e **exportação CSV**.
11. **Pacotes** de banho/serviços com saldo, validade e histórico de uso.
12. **Fidelidade** (1 ponto a cada R$10).
13. **Exames** com fluxo de status (Solicitado → Coletado → Em análise → Disponível) e registro de resultado.
14. **Termos e documentos** (em PDF).
15. **Suporte** com tutoriais, FAQ e chamados internos.
16. **Multiunidades** (matriz + filiais), estoque, agenda, financeiro e relatórios por unidade.
17. **Permissões** por perfil (matriz visível em Usuários).
18. **Logs de auditoria** em todas as ações relevantes.

## Segurança e qualidade

- Autenticação JWT + cookie HTTP-only.
- Middleware bloqueia rotas autenticadas sem sessão.
- Permissões por perfil aplicadas no menu lateral.
- Exclusão lógica (`isActive`) e logs de auditoria em todas as ações sensíveis.
- Validações no servidor.

## Roadmap

- Integração fiscal (NFe / NFSe) — estrutura preparada
- App mobile para tutores
- Notificações por WhatsApp / SMS (estrutura pronta para integrar com provedor)
- Telemedicina

---

© BilyVet — Plataforma de gestão para clínicas, hospitais e pet shops.
