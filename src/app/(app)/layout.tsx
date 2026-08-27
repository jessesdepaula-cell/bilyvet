import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BillingReminderPopup } from "@/components/billing/BillingReminderPopup";
import type { Role } from "@/lib/permissions";
import { calcularAvisoVencimento } from "@/lib/billing-reminder";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const isSuper = s.role === "SUPER_ADMIN";

  const [unit, tenant] = await Promise.all([
    s.unitId ? prisma.unit.findUnique({ where: { id: s.unitId } }) : Promise.resolve(null),
    !isSuper && s.tenantId
      ? prisma.tenant.findUnique({
          where: { id: s.tenantId },
          select: {
            id: true,
            status: true,
            subscriptions: {
              where: { status: { in: ["ACTIVE", "PENDING", "OVERDUE"] }, nextDueDate: { not: null } },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { nextDueDate: true, value: true },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  // Aviso de vencimento: pop-up quando faltarem 2 dias ou menos (inclui vencidas).
  //
  // O aviso sai da COBRANCA EM ABERTO mais antiga, nunca do campo nextDueDate da
  // assinatura. nextDueDate e um espelho do Asaas que so avanca quando o webhook
  // chega; se ele atrasa ou falha, o campo fica no vencimento passado e um cliente
  // em dia leva um alerta vermelho de "assinatura vencida" (foi o que aconteceu com
  // a VETZ em 26/08/2026). Sem fatura em aberto nao existe o que avisar, entao esta
  // versao e imune a atraso de webhook - e a data do aviso e o link da fatura passam
  // a vir sempre do mesmo pagamento, que antes podiam discordar entre si.
  let billingReminder: { dueDate: string; daysUntil: number; value: number | null; invoiceUrl: string | null } | null = null;
  if (!isSuper && s.tenantId) {
    const emAberto = await prisma.subscriptionPayment.findFirst({
      where: { tenantId: s.tenantId, status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true, invoiceUrl: true, value: true },
    });
    billingReminder = calcularAvisoVencimento(
      emAberto,
      new Date(),
      tenant?.subscriptions?.[0]?.value ?? null
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={s.role as Role} permissions={s.permissions ?? null} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          name={s.name}
          role={s.role as Role}
          unit={unit?.name}
          permissions={s.permissions ?? null}
          subscriptionStatus={tenant?.status ?? null}
        />
        {billingReminder && <BillingReminderPopup {...billingReminder} />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-[1600px] w-full mx-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
