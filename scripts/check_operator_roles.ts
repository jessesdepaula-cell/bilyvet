/** Quem pode operar o sistema pelo WhatsApp. Rodar: npx tsx scripts/check_operator_roles.ts */
import assert from "node:assert";
import { ehPapelDeOperador, PAPEIS_DE_OPERADOR } from "../src/lib/whatsapp/operator-roles";

// Papeis que o formulario de operadores realmente oferece
for (const papel of ["OWNER", "VET", "WORKER"]) {
  assert.ok(ehPapelDeOperador(papel), `${papel} deve poder operar`);
}

// O caso que abriu o buraco na VETZ: contato criado pelo cache de foto de perfil.
// 38 tutores e desconhecidos viraram operadores porque a checagem olhava so `active`.
assert.strictEqual(ehPapelDeOperador("CLIENTE"), false, "CLIENTE NUNCA pode operar o sistema");
assert.strictEqual(ehPapelDeOperador("DESCONHECIDO"), false, "DESCONHECIDO nao opera");
assert.strictEqual(ehPapelDeOperador(null), false, "sem papel nao opera");
assert.strictEqual(ehPapelDeOperador(undefined), false, "papel ausente nao opera");
assert.strictEqual(ehPapelDeOperador(""), false, "papel vazio nao opera");
assert.ok(!PAPEIS_DE_OPERADOR.includes("CLIENTE" as never), "CLIENTE fora da lista de operadores");

console.log("OK - operator-roles");
