import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { asaasIsConfigured, updateSubscription, nextDueDateFromPayment } from "@/lib/asaas";

// Webhook do Asaas - recebe eventos de pagamento/assinatura.
// Configure em https://www.asaas.com/customerWebhook
//   URL: https://SEU_DOMINIO/api/asaas/webhook
//   Token de autenticacao: defina ASAAS_WEBHOOK_TOKEN no env (opcional mas recomendado)

const WEBHOOK_TOKEN = (process.env.ASAAS_WEBHOOK_TOKEN || "")
  .replace(/[^\x20-\x7E]/g, "") // Remove non-printable ASCII (BOM, CR/LF, etc)
  .replace(/^["']|["']$/g, "")   // Remove wrapping quotes
  .trim();

function mapPaymentStatus(s?: string) {
  // Asaas usa: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, RECEIVED_IN_CASH,
  // REFUND_REQUESTED, CHARGEBACK_REQUESTED, CHARGEBACK_DISPUTE, AWAITING_CHARGEBACK_REVERSAL,
  // DUNNING_REQUESTED, DUNNING_RECEIVED, AWAITING_RISK_ANALYSIS
  return (s || "PENDING").toUpperCase();
}

export async function POST(req: Request) {
  // Validacao do token (header asaas-access-token)
  if (WEBHOOK_TOKEN) {
    const incoming = req.headers.get("asaas-access-token") || "";
    if (incoming !== WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }
  }

  const raw = await req.text();
  let body: any = {};
  try { body = JSON.parse(raw); } catch { body = {}; }

  const event: string = body?.event || "UNKNOWN";
  const payment = body?.payment;
  const subscription = body?.subscription;

  // Registra evento bruto (auditoria)
  const evt = await prisma.asaasWebhookEvent.create({
    data: { event, payload: raw },
  });

  try {
    if (payment) {
      const tenant = await prisma.tenant.findFirst({
        where: { asaasCustomerId: payment.customer },
      });
      const sub = payment.subscription
        ? await prisma.subscription.findUnique({ where: { asaasSubscriptionId: payment.subscription } })
        : null;

      if (tenant) {
        await prisma.subscriptionPayment.upsert({
          where: { asaasPaymentId: payment.id },
          create: {
            asaasPaymentId: payment.id,
            tenantId: tenant.id,
            subscriptionId: sub?.id,
            value: Number(payment.value || 0),
            netValue: payment.netValue ? Number(payment.netValue) : null,
            status: mapPaymentStatus(payment.status),
            billingType: payment.billingType,
            dueDate: payment.dueDate ? new Date(payment.dueDate) : new Date(),
            paidAt: payment.paymentDate ? new Date(payment.paymentDate) : null,
            invoiceUrl: payment.invoiceUrl,
            bankSlipUrl: payment.bankSlipUrl,
            description: payment.description,
            rawEvent: raw,
          },
          update: {
            status: mapPaymentStatus(payment.status),
            paidAt: payment.paymentDate ? new Date(payment.paymentDate) : null,
            netValue: payment.netValue ? Number(payment.netValue) : null,
            invoiceUrl: payment.invoiceUrl,
            bankSlipUrl: payment.bankSlipUrl,
            rawEvent: raw,
          },
        });

        // Atualiza status do tenant conforme evento
        if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
          await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "ACTIVE" } });
          if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: "ACTIVE" } });

          // Regra: proximo vencimento = 1 mes apos a data do pagamento.
          // Reagenda a assinatura no Asaas (movendo a fatura pendente) e localmente.
          const paidAt = payment.paymentDate ? new Date(payment.paymentDate) : null;
          if (sub && sub.asaasSubscriptionId && paidAt && !Number.isNaN(paidAt.getTime())) {
            const newDueDate = nextDueDateFromPayment(paidAt);
            // IDEMPOTENCIA: o Asaas reenvia evento (retry, reprocessamento), e com
            // updatePendingPayments ele GERA cobranca nova em vez de mover a
            // existente. Sem esta guarda, cada reenvio duplicaria a mensalidade.
            const dueDateLocal = sub.nextDueDate
              ? sub.nextDueDate.toISOString().slice(0, 10)
              : null;
            try {
              if (asaasIsConfigured() && dueDateLocal !== newDueDate) {
                await updateSubscription(sub.asaasSubscriptionId, {
                  nextDueDate: newDueDate,
                  updatePendingPayments: true,
                });
              }
              await prisma.subscription.update({
                where: { id: sub.id },
                data: { nextDueDate: new Date(`${newDueDate}T00:00:00.000Z`) },
              });
            } catch (reErr: any) {
              // Nao interrompe o processamento do pagamento se o reagendamento falhar
              await prisma.asaasWebhookEvent.update({
                where: { id: evt.id },
                data: { error: `reschedule falhou: ${String(reErr?.message || reErr)}` },
              });
            }
          }
        } else if (event === "PAYMENT_OVERDUE") {
          await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "PAST_DUE" } });
          if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: "OVERDUE" } });
        } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
          if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: "CANCELED" } });
        }
      }
    }

    if (subscription && (event === "SUBSCRIPTION_DELETED" || event === "SUBSCRIPTION_INACTIVATED")) {
      const sub = await prisma.subscription.findUnique({
        where: { asaasSubscriptionId: subscription.id },
      });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "CANCELED", canceledAt: new Date() },
        });
        await prisma.tenant.update({ where: { id: sub.tenantId }, data: { status: "CANCELED" } });
      }
    }

    await prisma.asaasWebhookEvent.update({ where: { id: evt.id }, data: { processed: true } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await prisma.asaasWebhookEvent.update({
      where: { id: evt.id },
      data: { error: String(err?.message || err) },
    });
    // Retorna 200 mesmo em erro de processamento pra evitar reenvio infinito do Asaas
    return NextResponse.json({ ok: false, error: String(err?.message || err) });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "asaas" });
}
