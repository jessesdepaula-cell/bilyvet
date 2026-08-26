# Graph Report - billypet  (2026-07-24)

## Corpus Check
- 188 files · ~82,097 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 766 nodes · 1808 edges · 71 communities (46 shown, 25 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1a43e04`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 64
- route.ts
- route.ts

## God Nodes (most connected - your core abstractions)
1. `requireTenantApi()` - 133 edges
2. `isTenantError()` - 131 edges
3. `requireModule()` - 78 edges
4. `BilyVet` - 43 edges
5. `PageHeader()` - 40 edges
6. `getSession()` - 32 edges
7. `fmtDateTime()` - 29 edges
8. `fmtMoney()` - 26 edges
9. `isSuperAdmin()` - 23 edges
10. `asaasIsConfigured()` - 21 edges

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

## Communities (71 total, 25 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (37): POST(), clientPrompt(), loadHistory(), operatorPrompt(), runAgent(), RunAgentParams, RunAgentResult, todayBrasilia() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (35): autoprefixer, description, devDependencies, autoprefixer, postcss, prisma, tailwindcss, tsx (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (22): AtendimentoPage(), EstoquePage(), StockForm(), ExamesPage(), FidelidadePage(), InternacaoActions(), InternacaoDetailPage(), InternacaoPage() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (24): AppLayout(), UsuariosPage(), PermissionsMatrix(), ROLES_PRA_CRIAR, Unit, User, UsersManager(), BillingReminderPopup() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (33): Agenda Module, App Mobile para Tutores, BilyVet, Cadastros Module, Esteira Module, Estoque Module, Exames Module, Fidelidade Module (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (23): checkNumber(), testSend(), POST(), POST(), GET(), normalizePhone(), POST(), GET() (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): PATCH(), POST(), DELETE(), PATCH(), DELETE(), PATCH(), GET(), POST() (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (21): mapPaymentStatus(), POST(), WEBHOOK_TOKEN, POST(), POST(), POST(), ASAAS_API_KEY, AsaasCustomer (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (27): bcryptjs, clsx, framer-motion, jose, jspdf, lucide-react, next, dependencies (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (17): GET(), POST(), POST(), POST(), PATCH(), GET(), POST(), DELETE() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (16): addDays(), AgendaPage(), startOfWeek(), DashboardPage(), CategoriesBar(), COLORS, PaymentMixPie(), RevenueLine() (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (18): AppointmentStatus, AppointmentStatusManager(), Collaborator, CollaboratorsManager(), ServiceOpt, UserOpt, ConfiguracoesPage(), DoseTemplate (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (16): POST(), POST(), AssinaturasPage(), brl(), STATUS_BADGE, CreateResult, NovoClienteForm(), NovoClientePage() (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (16): getAppUrl(), POST(), GET(), ALLOWED_ROLES, DELETE(), PATCH(), sanitizePermissions(), ALLOWED_ROLES (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (10): AtendimentoActions(), AtendimentoActionsProps, PayableActions(), ContasPagarPage(), PayClient(), ReceivableActions(), ContasReceberPage(), ReceiveClient() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (10): NovaInternacaoForm(), NovaInternacaoPage(), NovoProdutoPage(), Opt, Product, ProductForm(), NovoTutorPage(), Tutor (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (12): PetDetailPage(), PetProfileClient(), PetProfileClientProps, ProtocolTemplate, TutorOpt, NovoPetPage(), Pet, PetForm() (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.27
Nodes (11): POST(), POST(), POST(), POST(), getPixQrCode(), clearSessionCookie(), secret(), SessionUser (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.28
Nodes (12): digits(), nextDueDateISO(), POST(), digits(), nextDueDateISO(), POST(), digits(), getAppUrl() (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (12): ActivateForm(), maskCnpj(), maskPhone(), maskZip(), Props, AssinaturaPage(), brl(), fmtDate() (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (10): GET(), POST(), AppointmentForm(), Collaborator, Pet, Service, StatusOpt, Tutor (+2 more)

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (8): CashActions(), CaixaPage(), FinanceiroPage(), InventarioPage(), ProdutosPage(), RelatoriosPage(), VendasPage(), fmtMoney()

### Community 23 - "Community 23"
Cohesion: 0.60
Nodes (4): config, middleware(), PUBLIC, PUBLIC_API_PREFIXES

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, $schema

### Community 25 - "Community 25"
Cohesion: 0.26
Nodes (10): CATEGORY_META, TutoriaisPage(), TutorialDetalhePage(), getTutorial(), sortedTutorials(), Tutorial, TUTORIALS, tutorialsByCategory() (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.28
Nodes (6): MedicalRecordForm(), MR, Prescription, AtendimentoDetailPage(), PipelineSelect(), StatusOpt

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): NovaVendaPage(), Item, Method, POS(), Product, Service, Tutor

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (6): CheckoutClient(), maskCardExpiry(), maskCardNumber(), maskCpfCnpj(), maskPhone(), metadata

### Community 29 - "Community 29"
Cohesion: 0.28
Nodes (4): metadata, LandingPage(), metadata, WhatsAppFloat()

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (3): ensureSuperAdmin(), main(), prisma

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (4): Autenticação JWT, HTTP-only cookies, jose, JWT

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (4): Prisma ORM, prisma/schema.prisma, prisma/seed.ts, SQLite

### Community 33 - "Community 33"
Cohesion: 0.32
Nodes (5): WhatsAppConfigPage(), OperatorContact, WhatsAppSettingsClient(), ConnectionState, WhatsAppConnect()

### Community 34 - "Community 34"
Cohesion: 0.32
Nodes (6): Subscription, Tenant, TenantActions(), brl(), STATUS_BADGE, TenantDetailPage()

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (5): ChatInboxClient(), ContactInfo, Conversation, Message, ChatPage()

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (4): Card, EsteiraBoard(), StatusOpt, EsteiraPage()

### Community 37 - "Community 37"
Cohesion: 0.83
Nodes (3): DELETE(), fetchOwned(), PATCH()

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (3): DELETE(), GET(), POST()

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): Exam, ExamsClient(), STATUSES

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (3): Atendimento Module, jsPDF, Receituário PDF

## Knowledge Gaps
- **209 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireTenantApi()` connect `Community 6` to `Community 2`, `Community 5`, `Community 7`, `Community 10`, `Community 13`, `Community 14`, `Community 19`, `Community 21`, `Community 37`, `Community 38`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 58`, `Community 59`, `Community 61`, `Community 64`, `route.ts`, `route.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `requireModule()` connect `Community 2` to `Community 33`, `Community 35`, `Community 36`, `Community 3`, `Community 11`, `Community 12`, `Community 15`, `Community 16`, `Community 17`, `Community 20`, `Community 21`, `Community 22`, `Community 26`, `Community 27`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `isTenantError()` connect `Community 10` to `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 14`, `Community 19`, `Community 21`, `Community 37`, `Community 38`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 58`, `Community 59`, `Community 61`, `Community 64`, `route.ts`, `route.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08902439024390243 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11806543385490754 - nodes in this community are weakly interconnected._