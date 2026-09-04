/**
 * Trava da regra de vencimento. Rodar: npx tsx scripts/check_vencimento_ancorado.ts
 *
 * REGRA (Jesse, 04/09/2026): o dia do vencimento do assinante NAO muda quando ele
 * paga atrasado. A VETZ vence dia 4 - pagando dia 4 ou dia 5, continua dia 4. Sem
 * juros e sem multa. Quem mantem o ancoramento e o ciclo MONTHLY do proprio Asaas.
 *
 * Este check existe porque a regra ja quebrou DUAS vezes pelo mesmo caminho: o
 * codigo calculava o proximo vencimento a partir da DATA DO PAGAMENTO e reagendava
 * a assinatura pedindo updatePendingPayments, que faz o Asaas GERAR cobranca nova
 * em vez de mover a pendente. Resultado em agosto/2026: a VETZ com 2 cobrancas para
 * 04/09 e 2 para 04/10, R$ 394 no mes em vez de R$ 197.
 */
import assert from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function arquivosTs(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivosTs(caminho, acc);
    else if (/\.tsx?$/.test(nome)) acc.push(caminho);
  }
  return acc;
}

const proibidos = [
  { termo: "updatePendingPayments", porque: "faz o Asaas GERAR cobranca nova em vez de mover a pendente" },
  { termo: "nextDueDateFromPayment", porque: "derivava o vencimento da data do pagamento e arrastava o dia" },
];

// Tira o CR do CRLF ANTES de cortar o comentario: em regex JS o ponto nao casa
// com CR, entao sem isso o corte nao acontece e o proprio comentario que explica
// a regra e acusado como violacao.
const semComentario = (linha: string) =>
  linha.replace(/\r/g, "").replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");

const ofensas: string[] = [];
for (const arquivo of arquivosTs("src")) {
  readFileSync(arquivo, "utf8").split("\n").forEach((linha, i) => {
    const codigo = semComentario(linha);
    for (const { termo, porque } of proibidos) {
      if (codigo.includes(termo)) ofensas.push(arquivo + ":" + (i + 1) + " usa " + termo + " - " + porque);
    }
  });
}

// o proprio cortador precisa funcionar, senao o check passa por engano
assert.strictEqual(semComentario("  // usa updatePendingPayments\r"), "  ", "corte de comentario quebrado com CRLF");
assert.ok(semComentario("  updatePendingPayments: true,").includes("updatePendingPayments"), "corte nao pode comer codigo real");

assert.deepStrictEqual(ofensas, [], "O vencimento voltou a ser calculado a partir do pagamento:\n  " + ofensas.join("\n  "));

console.log("OK: nenhum codigo reagenda o vencimento a partir da data do pagamento.");
console.log("OK: o dia do vencimento fica ancorado no ciclo MONTHLY do Asaas.");
