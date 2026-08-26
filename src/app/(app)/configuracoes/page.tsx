import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireModule } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServicesManager } from "./ServicesManager";
import { SimpleManager } from "./SimpleManager";
import { SupplierManager } from "./SupplierManager";
import { CollaboratorsManager } from "./CollaboratorsManager";
import { ProtocolTemplateManager } from "./ProtocolTemplateManager";
import { AppointmentStatusManager } from "./AppointmentStatusManager";
import { ClinicIdentity } from "./ClinicIdentity";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage({ searchParams }: { searchParams: { tab?: string } }) {
  const { tenantId } = await requireModule("configuracoes");
  const activeTab = searchParams.tab || "clinica";

  const [services, methods, machines, categories, suppliers, tenant] = await Promise.all([
    prisma.service.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.cardMachine.findMany({ where: { tenantId } }),
    prisma.productCategory.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { tenantId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        companyName: true, tradeName: true, cnpj: true, email: true, phone: true,
        address: true, city: true, state: true, zipCode: true, logoUrl: true,
      },
    }),
  ]);

  const tabs = [
    { id: "clinica", label: "Clinica & Receita" },
    { id: "servicos", label: "Servicos & Status" },
    { id: "colaboradores", label: "Colaboradores" },
    { id: "protocolos", label: "Modelos de Protocolos" },
    { id: "produtos", label: "Produtos & Financas" },
  ];

  return (
    <>
      <PageHeader
        title="Configuracoes do Sistema"
        description="Gerencie servicos, colaboradores, protocolos, formas de pagamento e fornecedores"
        tutorialSlug="configuracoes"
      />

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/configuracoes?tab=${tab.id}`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                active
                  ? "border-b-2 border-brand-600 text-brand-600 bg-brand-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === "clinica" && tenant && (
          <div className="max-w-3xl">
            <ClinicIdentity initial={tenant} />
          </div>
        )}

        {activeTab === "servicos" && (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="card card-pad lg:col-span-2">
              <ServicesManager
                initial={services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  category: s.category,
                  durationMinutes: s.durationMinutes,
                  price: s.price,
                  commissionPct: s.commissionPct,
                  isActive: s.isActive,
                }))}
              />
            </div>
            <div className="card card-pad">
              <AppointmentStatusManager />
            </div>
          </div>
        )}

        {activeTab === "colaboradores" && (
          <div className="card card-pad">
            <CollaboratorsManager
              services={services.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        )}

        {activeTab === "protocolos" && (
          <div className="card card-pad">
            <ProtocolTemplateManager />
          </div>
        )}

        {activeTab === "produtos" && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card card-pad">
              <SimpleManager
                title="Categorias de produtos"
                endpoint="/api/categories"
                initial={categories.map((c) => ({ id: c.id, name: c.name }))}
                emptyMessage="Crie categorias para organizar produtos (Racao, Medicamento, etc)."
              />
            </div>

            <div className="card card-pad">
              <SupplierManager
                initial={suppliers.map((s) => ({
                  id: s.id,
                  name: s.name,
                  document: s.document,
                  phone: s.phone,
                  email: s.email,
                }))}
              />
            </div>

            <div className="card card-pad">
              <h3 className="font-semibold mb-3 text-slate-800">Formas de pagamento</h3>
              <ul className="space-y-1 text-sm">
                {methods.map((m) => (
                  <li key={m.id} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
                    <span className="font-medium text-slate-700">{m.name}</span>
                    <span className="badge-gray">{m.type}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400 mt-3">Para adicionar ou gerenciar novas formas de recebimento, contate o administrador.</p>
            </div>

            <div className="card card-pad">
              <h3 className="font-semibold mb-3 text-slate-800">Maquinas de cartao</h3>
              {machines.length === 0 ? (
                <p className="text-sm text-slate-500 py-3 text-center bg-slate-50 rounded-lg">Nenhuma maquina cadastrada.</p>
              ) : (
                <table className="bp-table text-sm">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Operadora</th>
                      <th>Debito</th>
                      <th>Credito</th>
                      <th>Recebimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.operator}</td>
                        <td>{m.debitFee}%</td>
                        <td>{m.creditFee}%</td>
                        <td>{m.receivingDays}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
