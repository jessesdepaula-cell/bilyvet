import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { asaasIsConfigured, getSubscription, listSubscriptionPayments, updateSubscription, nextDueDateFromPayment } from "@/lib/asaas";

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

      // Regra: proximo vencimento = 1 mes apos o ultimo pagamento efetivado.
      // Corrige assinaturas cujo nextDueDate ainda segue o ciclo antigo (dia fixo).
      const paidPayments = data
        .filter((p) => p.paymentDate && ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes((p.status || "").toUpperCase()))
        .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());
      const lastPaid = paidPayments[0];
      if (lastPaid?.paymentDate) {
        const newDueDate = nextDueDateFromPayment(new Date(lastPaid.paymentDate));
        // IDEMPOTENCIA: so mexe no Asaas se a data mudou de verdade. Com
        // updatePendingPayments o Asaas GERA uma cobranca nova em vez de mover a
        // existente, entao chamar isso a cada sync duplicava a mensalidade do
        // cliente - uma cobranca extra por execucao (aconteceu na VETZ em 26/08/2026,
        // 2 cobrancas para 04/09 e 2 para 04/10).
        if (remote.nextDueDate !== newDueDate) {
          try {
            await updateSubscription(sub.asaasSubscriptionId, { nextDueDate: newDueDate, updatePendingPayments: true });
          } catch {
            // se o Asaas recusar, mantem ao menos o valor local coerente
          }
        }
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextDueDate: new Date(`${newDueDate}T00:00:00.000Z`) },
        });
      }
      updated++;
    } catch (e: any) {
      // segue para a proxima
    }
  }

  return NextResponse.json({ ok: true, syncedSubscriptions: updated });
}
