/** Verificacao da regra de aviso de vencimento. Rodar: npx tsx scripts/check_billing_reminder.ts */
import assert from "node:assert";
import { calcularAvisoVencimento } from "../src/lib/billing-reminder";

const hoje = new Date("2026-08-26T12:00:00");
const d = (iso: string) => new Date(`${iso}T00:00:00`);

// O caso que quebrou em producao: VETZ pagou 04/08 e nao tinha NADA em aberto.
// Antes o popup lia nextDueDate=04/08 e gritava "vencida ha 23 dias".
assert.strictEqual(calcularAvisoVencimento(null, hoje), null, "cliente sem fatura em aberto nao pode receber aviso");

// Proxima fatura da VETZ vence 04/09: longe demais para avisar.
assert.strictEqual(
  calcularAvisoVencimento({ dueDate: d("2026-09-04"), value: 197 }, hoje),
  null,
  "fatura a 9 dias nao deve avisar"
);

// A 2 dias comeca a avisar.
const doisDias = calcularAvisoVencimento({ dueDate: d("2026-08-28"), value: 197 }, hoje);
assert.ok(doisDias && doisDias.daysUntil === 2, "deve avisar faltando 2 dias");

// Vencida de verdade: dias negativos.
const vencida = calcularAvisoVencimento({ dueDate: d("2026-08-20"), value: 197, invoiceUrl: "u" }, hoje);
assert.ok(vencida && vencida.daysUntil === -6, "fatura em aberto e vencida deve acusar dias negativos");
assert.strictEqual(vencida!.invoiceUrl, "u", "link da fatura vem do MESMO pagamento do aviso");

// Valor cai para o da assinatura quando a cobranca nao traz valor.
const semValor = calcularAvisoVencimento({ dueDate: d("2026-08-26") }, hoje, 197);
assert.strictEqual(semValor!.value, 197, "valor deve cair para o da assinatura");

console.log("OK - billing-reminder");
