import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { asaasIsConfigured, getSubscription, listSubscriptionPayments } from "@/lib/asaas";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (!isSuperAdmin(s.role)) return NextResponse.json({ error: "Apenas SUPER_ADMIN" }, { status: 403 });
  if (!asaasIsConfigured()) return NextResponse.json({ error: "ASAAS_API_KEY nao configurada" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: { subscriptions: true },
  });
  if (!tenant) return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });

  let updated = 0;
  for (const sub of tenant.subscriptions) {
    if (!sub.asaasSubscriptionId) continue;
    try {
      const remote = await getSubscription(sub.asaasSubscriptionId);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: remote.status === "ACTIVE" ? "ACTIVE" : remote.status === "EXPIRED" ? "EXPIRED" : sub.status,
          value: remote.value,
          nextDueDate: remote.nextDueDate ? new Date(remote.nextDueDate) : sub.nextDueDate,
          billingType: remote.billingType,
        },
      });
      const { data } = await listSubscriptionPayments(sub.asaasSubscriptionId);
      for (const p of data) {
        await prisma.subscriptionPayment.upsert({
          where: { asaasPaymentId: p.id },
          create: {
            asaasPaymentId: p.id,
            tenantId: tenant.id,
            subscriptionId: sub.id,
            value: p.value,
            netValue: p.netValue,
            status: p.status,
            billingType: p.billingType,
            dueDate: new Date(p.dueDate),
            paidAt: p.paymentDate ? new Date(p.paymentDate) : null,
            invoiceUrl: p.invoiceUrl,
            bankSlipUrl: p.bankSlipUrl,
            description: p.description,
          },
          update: {
            status: p.status,
            paidAt: p.paymentDate ? new Date(p.paymentDate) : null,
            netValue: p.netValue,
            invoiceUrl: p.invoiceUrl,
            bankSlipUrl: p.bankSlipUrl,
          },
        });
      }

      // O dia do vencimento e ancorado pelo ciclo MONTHLY do Asaas e ja foi
      // espelhado acima (`remote.nextDueDate`). Este sync e SO LEITURA sobre a
      // assinatura: nao reagenda, nao chama updateSubscription. A versao anterior
      // recalculava a data a partir do ultimo pagamento e, a cada execucao,
      // duplicava a mensalidade do cliente. Ver src/app/api/asaas/webhook/route.ts.
      updated++;
    } catch (e: any) {
      // segue para a proxima
    }
  }

  return NextResponse.json({ ok: true, syncedSubscriptions: updated });
}
