# Graph Report - billypet  (2026-09-03)

## Corpus Check
- 197 files · ~89,701 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1016 nodes · 2243 edges · 92 communities (67 shown, 25 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c39929d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tools.ts
- devDependencies
- BilyVet
- requireModule
- evolution.ts
- getSession
- produtos/novo/page.tsx
- asaas.ts
- dependencies
- compilerOptions
- isTenantError
- requireTenantApi
- configuracoes/page.tsx
- contas-pagar/page.tsx
- permissions.ts
- users/route.ts
- utils.ts
- tenants/route.ts
- (app)/layout.tsx
- assinatura/page.tsx
- AppointmentForm.tsx
- db.ts
- tutorials.ts
- atendimento/[id]/page.tsx
- vendas/nova/page.tsx
- CheckoutClient
- app/page.tsx
- whatsapp/page.tsx
- clientes/[id]/page.tsx
- tutores/novo/page.tsx
- chat/page.tsx
- receita-pdf.ts
- middleware.ts
- vercel.json
- seed.ts
- JWT
- Prisma ORM
- pets/[id]/route.ts
- fmtMoney
- esteira/page.tsx
- ExamsClient
- PetProfileClient.tsx
- cleanup-demo.ts
- Receituário PDF
- check_vetz_ai_config.ts
- check_vetz_messages.ts
- tenant.ts
- checkout/subscribe/route.ts
- ServicesManager
- PetProfileClient
- [attachmentId]/route.ts
- scripts
- products/[id]/route.ts
- contas-receber/page.tsx
- CollaboratorsManager
- ProtocolTemplateManager
- AppointmentStatusManager
- suppliers/[id]/route.ts
- ClinicIdentity
- tickets/route.ts
- tutors/route.ts
- settings/route.ts
- redefinir-senha/page.tsx
- next.config.mjs
- next-env.d.ts
- Next.js 14
- Dashboard Module
- Middleware de Segurança
- LoginPage
- RecuperarSenhaPage
- tailwind.config.ts
- internacao/[id]/page.tsx
- tenant/route.ts
- users/[id]/route.ts
- SimpleManager
- estoque/page.tsx
- internacao/nova/page.tsx
- transferencias/page.tsx
- package.json
- attachments/route.ts
- NovoClienteForm
- CollaboratorsManager.tsx
- ProtocolTemplateManager.tsx
- accounts/route.ts
- categories/[id]/route.ts
- config/route.ts
- bcryptjs
- lucide-react
- react

## God Nodes (most connected - your core abstractions)
1. `requireTenantApi()` - 140 edges
2. `isTenantError()` - 138 edges
3. `prisma` - 112 edges
4. `requireModule()` - 77 edges
5. `BilyVet` - 43 edges
6. `PageHeader()` - 40 edges
7. `getSession()` - 32 edges
8. `fmtDateTime()` - 29 edges
9. `fmtMoney()` - 27 edges
10. `isSuperAdmin()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `checkNumber()` --calls--> `getEvolutionConfig()`  [EXTRACTED]
  scripts/check_number.ts → src/lib/whatsapp/evolution.ts
- `testSend()` --calls--> `getConnectionState()`  [EXTRACTED]
  scripts/test_send_whatsapp.ts → src/lib/whatsapp/evolution.ts
- `testSend()` --calls--> `sendText()`  [EXTRACTED]
  scripts/test_send_whatsapp.ts → src/lib/whatsapp/evolution.ts
- `ChatPage()` --calls--> `requireModule()`  [EXTRACTED]
  src/app/(app)/atendimento/chat/page.tsx → src/lib/tenant.ts
- `ConfiguracoesPage()` --calls--> `requireModule()`  [EXTRACTED]
  src/app/(app)/configuracoes/page.tsx → src/lib/tenant.ts

## Import Cycles
- None detected.

## Communities (92 total, 25 thin omitted)

### Community 0 - "tools.ts"
Cohesion: 0.07
Nodes (41): POST(), handleSaveAiSettings(), clientPrompt(), loadHistory(), operatorPrompt(), runAgent(), RunAgentParams, RunAgentResult (+33 more)

### Community 1 - "devDependencies"
Cohesion: 0.10
Nodes (21): autoprefixer, devDependencies, autoprefixer, postcss, prisma, tailwindcss, tsx, @types/bcryptjs (+13 more)

### Community 2 - "BilyVet"
Cohesion: 0.06
Nodes (33): Agenda Module, App Mobile para Tutores, BilyVet, Cadastros Module, Esteira Module, Estoque Module, Exames Module, Fidelidade Module (+25 more)

### Community 3 - "requireModule"
Cohesion: 0.10
Nodes (29): AtendimentoPage(), dynamic, dynamic, ExamesPage(), dynamic, FidelidadePage(), dynamic, InternacaoPage() (+21 more)

### Community 4 - "evolution.ts"
Cohesion: 0.17
Nodes (23): checkNumber(), testSend(), POST(), POST(), GET(), normalizePhone(), POST(), GET() (+15 more)

### Community 5 - "getSession"
Cohesion: 0.13
Nodes (22): POST(), POST(), POST(), AssinaturasPage(), brl(), dynamic, STATUS_BADGE, dynamic (+14 more)

### Community 6 - "produtos/novo/page.tsx"
Cohesion: 0.22
Nodes (5): dynamic, NovoProdutoPage(), Opt, Product, ProductForm()

### Community 7 - "asaas.ts"
Cohesion: 0.14
Nodes (25): mapPaymentStatus(), POST(), WEBHOOK_TOKEN, digits(), nextDueDateISO(), POST(), POST(), POST() (+17 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): clsx, framer-motion, jose, jspdf, dependencies, clsx, framer-motion, jose (+13 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 10 - "isTenantError"
Cohesion: 0.12
Nodes (20): GET(), POST(), DELETE(), PATCH(), GET(), POST(), DELETE(), PATCH() (+12 more)

### Community 11 - "requireTenantApi"
Cohesion: 0.13
Nodes (19): DELETE(), PATCH(), GET(), POST(), GET(), POST(), DELETE(), PATCH() (+11 more)

### Community 12 - "configuracoes/page.tsx"
Cohesion: 0.29
Nodes (4): ConfiguracoesPage(), dynamic, Supplier, SupplierManager()

### Community 13 - "contas-pagar/page.tsx"
Cohesion: 0.24
Nodes (4): PayableActions(), ContasPagarPage(), dynamic, PayClient()

### Community 14 - "permissions.ts"
Cohesion: 0.12
Nodes (20): dynamic, PermissionsMatrix(), ROLES_PRA_CRIAR, Unit, User, UsersManager(), changeRoleInDraft(), createUser() (+12 more)

### Community 15 - "users/route.ts"
Cohesion: 0.23
Nodes (11): getAppUrl(), POST(), GET(), ALLOWED_ROLES, GET(), getAppUrl(), POST(), sanitizePermissions() (+3 more)

### Community 16 - "utils.ts"
Cohesion: 0.11
Nodes (22): addDays(), AgendaPage(), dynamic, startOfWeek(), DashboardPage(), dynamic, dynamic, FinanceiroPage() (+14 more)

### Community 17 - "tenants/route.ts"
Cohesion: 0.36
Nodes (8): digits(), nextDueDateISO(), POST(), digits(), getAppUrl(), nextDueDateISO(), POST(), createSubscription()

### Community 18 - "(app)/layout.tsx"
Cohesion: 0.08
Nodes (17): doisDias, hoje, semValor, vencida, AppLayout(), BillingReminderPopup(), BillingReminderPopupProps, Group (+9 more)

### Community 19 - "assinatura/page.tsx"
Cohesion: 0.16
Nodes (13): ActivateForm(), maskCnpj(), maskPhone(), maskZip(), Props, AssinaturaPage(), brl(), dynamic (+5 more)

### Community 20 - "AppointmentForm.tsx"
Cohesion: 0.20
Nodes (6): AppointmentForm(), Collaborator, Pet, Service, StatusOpt, Tutor

### Community 21 - "db.ts"
Cohesion: 0.13
Nodes (17): GET(), POST(), PATCH(), POST(), POST(), PATCH(), GET(), POST() (+9 more)

### Community 22 - "tutorials.ts"
Cohesion: 0.24
Nodes (10): TutoriaisPage(), dynamic, TutorialDetalhePage(), getTutorial(), sortedTutorials(), Tutorial, TUTORIALS, tutorialsByCategory() (+2 more)

### Community 23 - "atendimento/[id]/page.tsx"
Cohesion: 0.16
Nodes (9): AtendimentoActions(), AtendimentoActionsProps, AtendimentoDetailPage(), dynamic, PipelineSelect(), StatusOpt, dynamic, PacotesPage() (+1 more)

### Community 24 - "vendas/nova/page.tsx"
Cohesion: 0.14
Nodes (8): dynamic, NovaVendaPage(), Item, Method, POS(), Product, Service, Tutor

### Community 25 - "CheckoutClient"
Cohesion: 0.27
Nodes (6): CheckoutClient(), maskCardExpiry(), maskCardNumber(), maskCpfCnpj(), maskPhone(), metadata

### Community 26 - "app/page.tsx"
Cohesion: 0.24
Nodes (5): metadata, LandingPage(), metadata, ROTAS_PUBLICAS, WhatsAppFloat()

### Community 27 - "whatsapp/page.tsx"
Cohesion: 0.16
Nodes (12): dynamic, WhatsAppConfigPage(), OperatorContact, WhatsAppSettingsClient(), handleAddContact(), handleRemoveContact(), loadContacts(), ConnectionState (+4 more)

### Community 28 - "clientes/[id]/page.tsx"
Cohesion: 0.24
Nodes (7): Subscription, Tenant, TenantActions(), brl(), dynamic, STATUS_BADGE, TenantDetailPage()

### Community 29 - "tutores/novo/page.tsx"
Cohesion: 0.25
Nodes (4): dynamic, NovoTutorPage(), Tutor, TutorForm()

### Community 30 - "chat/page.tsx"
Cohesion: 0.21
Nodes (9): ChatInboxClient(), fetchConversations(), fetchMessageThread(), handleSendMessage(), ContactInfo, Conversation, Message, ChatPage() (+1 more)

### Community 31 - "receita-pdf.ts"
Cohesion: 0.08
Nodes (37): base, comEspecialista, comLogo, comLogoQuebrada, comTextoLivre, hoje, muitos, texto (+29 more)

### Community 32 - "middleware.ts"
Cohesion: 0.40
Nodes (3): config, PUBLIC, PUBLIC_API_PREFIXES

### Community 33 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, $schema

### Community 34 - "seed.ts"
Cohesion: 0.67
Nodes (3): ensureSuperAdmin(), main(), prisma

### Community 35 - "JWT"
Cohesion: 0.67
Nodes (4): Autenticação JWT, HTTP-only cookies, jose, JWT

### Community 36 - "Prisma ORM"
Cohesion: 0.50
Nodes (4): Prisma ORM, prisma/schema.prisma, prisma/seed.ts, SQLite

### Community 37 - "pets/[id]/route.ts"
Cohesion: 0.83
Nodes (3): DELETE(), fetchOwned(), PATCH()

### Community 38 - "fmtMoney"
Cohesion: 0.16
Nodes (10): CashActions(), closeCash(), CaixaPage(), dynamic, dynamic, InventarioPage(), dynamic, ProdutosPage() (+2 more)

### Community 39 - "esteira/page.tsx"
Cohesion: 0.24
Nodes (7): Card, EsteiraBoard(), move(), onDrop(), StatusOpt, dynamic, EsteiraPage()

### Community 40 - "ExamsClient"
Cohesion: 0.29
Nodes (3): Exam, ExamsClient(), STATUSES

### Community 41 - "PetProfileClient.tsx"
Cohesion: 0.16
Nodes (8): PetProfileClientProps, ProtocolTemplate, TutorOpt, dynamic, NovoPetPage(), Pet, PetForm(), TutorOpt

### Community 43 - "Receituário PDF"
Cohesion: 0.67
Nodes (3): Atendimento Module, jsPDF, Receituário PDF

### Community 46 - "tenant.ts"
Cohesion: 0.12
Nodes (8): POST(), PATCH(), POST(), POST(), POST(), POST(), BLOCK_BYPASS_MODULES, TenantContext

### Community 47 - "checkout/subscribe/route.ts"
Cohesion: 0.39
Nodes (9): POST(), POST(), POST(), UsuariosPage(), createCustomer(), getPixQrCode(), setSessionCookie(), signSession() (+1 more)

### Community 48 - "ServicesManager"
Cohesion: 0.20
Nodes (5): CATEGORIES, Service, ServicesManager(), cancel(), save()

### Community 49 - "PetProfileClient"
Cohesion: 0.20
Nodes (3): PetProfileClient(), handleFileUpload(), reloadAttachments()

### Community 50 - "[attachmentId]/route.ts"
Cohesion: 0.50
Nodes (3): DELETE(), GET(), runtime

### Community 51 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:push, db:reset, db:seed, dev, lint, postinstall (+2 more)

### Community 53 - "contas-receber/page.tsx"
Cohesion: 0.24
Nodes (4): ReceivableActions(), ContasReceberPage(), dynamic, ReceiveClient()

### Community 54 - "CollaboratorsManager"
Cohesion: 0.28
Nodes (4): CollaboratorsManager(), fetchCollaborators(), remove(), save()

### Community 55 - "ProtocolTemplateManager"
Cohesion: 0.28
Nodes (4): ProtocolTemplateManager(), fetchTemplates(), remove(), save()

### Community 56 - "AppointmentStatusManager"
Cohesion: 0.32
Nodes (5): AppointmentStatus, AppointmentStatusManager(), fetchStatuses(), remove(), save()

### Community 58 - "ClinicIdentity"
Cohesion: 0.38
Nodes (5): Clinic, ClinicIdentity(), pickLogo(), u(), fileToLogoDataUrl()

### Community 73 - "internacao/[id]/page.tsx"
Cohesion: 0.33
Nodes (3): InternacaoActions(), dynamic, InternacaoDetailPage()

### Community 74 - "tenant/route.ts"
Cohesion: 0.33
Nodes (5): GET(), PATCH(), runtime, SELECT, TEXT_FIELDS

### Community 75 - "users/[id]/route.ts"
Cohesion: 0.40
Nodes (5): ALLOWED_ROLES, DELETE(), PATCH(), sanitizePermissions(), ALL_MODULE_SLUGS

### Community 77 - "estoque/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, EstoquePage(), StockForm()

### Community 78 - "internacao/nova/page.tsx"
Cohesion: 0.40
Nodes (3): NovaInternacaoForm(), dynamic, NovaInternacaoPage()

### Community 79 - "transferencias/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, TransferenciasPage(), TransferForm()

### Community 80 - "package.json"
Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 81 - "attachments/route.ts"
Cohesion: 0.40
Nodes (4): GET(), maxDuration, POST(), runtime

### Community 83 - "CollaboratorsManager.tsx"
Cohesion: 0.50
Nodes (3): Collaborator, ServiceOpt, UserOpt

### Community 84 - "ProtocolTemplateManager.tsx"
Cohesion: 0.50
Nodes (3): DoseTemplate, PROTOCOL_TYPES, ProtocolTemplate

## Knowledge Gaps
- **289 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `db.ts` to `tools.ts`, `requireModule`, `evolution.ts`, `getSession`, `produtos/novo/page.tsx`, `asaas.ts`, `isTenantError`, `requireTenantApi`, `configuracoes/page.tsx`, `contas-pagar/page.tsx`, `permissions.ts`, `users/route.ts`, `utils.ts`, `tenants/route.ts`, `(app)/layout.tsx`, `assinatura/page.tsx`, `atendimento/[id]/page.tsx`, `vendas/nova/page.tsx`, `clientes/[id]/page.tsx`, `pets/[id]/route.ts`, `fmtMoney`, `esteira/page.tsx`, `PetProfileClient.tsx`, `tenant.ts`, `checkout/subscribe/route.ts`, `[attachmentId]/route.ts`, `products/[id]/route.ts`, `contas-receber/page.tsx`, `suppliers/[id]/route.ts`, `tickets/route.ts`, `tutors/route.ts`, `settings/route.ts`, `internacao/[id]/page.tsx`, `tenant/route.ts`, `users/[id]/route.ts`, `estoque/page.tsx`, `internacao/nova/page.tsx`, `transferencias/page.tsx`, `attachments/route.ts`, `accounts/route.ts`, `categories/[id]/route.ts`, `config/route.ts`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `requireModule()` connect `requireModule` to `produtos/novo/page.tsx`, `asaas.ts`, `configuracoes/page.tsx`, `contas-pagar/page.tsx`, `permissions.ts`, `utils.ts`, `assinatura/page.tsx`, `db.ts`, `atendimento/[id]/page.tsx`, `vendas/nova/page.tsx`, `whatsapp/page.tsx`, `tutores/novo/page.tsx`, `chat/page.tsx`, `fmtMoney`, `esteira/page.tsx`, `PetProfileClient.tsx`, `tenant.ts`, `checkout/subscribe/route.ts`, `contas-receber/page.tsx`, `internacao/[id]/page.tsx`, `estoque/page.tsx`, `internacao/nova/page.tsx`, `transferencias/page.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `requireTenantApi()` connect `requireTenantApi` to `evolution.ts`, `getSession`, `asaas.ts`, `isTenantError`, `users/route.ts`, `utils.ts`, `db.ts`, `pets/[id]/route.ts`, `tenant.ts`, `[attachmentId]/route.ts`, `products/[id]/route.ts`, `suppliers/[id]/route.ts`, `tickets/route.ts`, `tutors/route.ts`, `settings/route.ts`, `tenant/route.ts`, `users/[id]/route.ts`, `attachments/route.ts`, `accounts/route.ts`, `categories/[id]/route.ts`, `config/route.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tools.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07358156028368794 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `BilyVet` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._