/**
 * Regra do aviso de vencimento da assinatura.
 *
 * Fica isolada aqui porque ja errou em producao: a versao anterior decidia pelo
 * campo `Subscription.nextDueDate`, um espelho do Asaas que so avanca quando o
 * webhook chega. Com o webhook atrasado, a VETZ (em dia, paga em 04/08/2026)
 * levou um alerta vermelho de "assinatura vencida ha 23 dias" em 26/08/2026.
 *
 * A regra correta parte da COBRANCA EM ABERTO: sem fatura em aberto nao existe
 * o que avisar, entao nenhum atraso de sincronismo consegue acusar um cliente
 * adimplente.
 */

export type CobrancaEmAberto = {
  dueDate: Date;
  value?: number | null;
  invoiceUrl?: string | null;
};

export type AvisoVencimento = {
  dueDate: string;
  daysUntil: number;
  value: number | null;
  invoiceUrl: string | null;
};

/** Antecedencia (em dias) com que o aviso comeca a aparecer. */
export const DIAS_DE_ANTECEDENCIA = 2;

function inicioDoDia(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function calcularAvisoVencimento(
  emAberto: CobrancaEmAberto | null | undefined,
  hoje: Date = new Date(),
  valorPadrao: number | null = null
): AvisoVencimento | null {
  if (!emAberto) return null;

  const vencimento = inicioDoDia(emAberto.dueDate);
  const daysUntil = Math.round((vencimento.getTime() - inicioDoDia(hoje).getTime()) / 86400000);
  if (daysUntil > DIAS_DE_ANTECEDENCIA) return null;

  return {
    dueDate: vencimento.toISOString(),
    daysUntil,
    value: emAberto.value ?? valorPadrao,
    invoiceUrl: emAberto.invoiceUrl ?? null,
  };
}
