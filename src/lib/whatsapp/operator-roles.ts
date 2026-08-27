/**
 * Papeis que autorizam alguem a operar o sistema pelo WhatsApp.
 *
 * Existe porque a tabela `WhatsappContact` acumula DUAS funcoes: e a agenda de
 * contatos (nome, foto de perfil) E a lista de quem pode alimentar o sistema pela
 * IA. Enquanto a autorizacao era "existe linha nessa tabela?", qualquer contato
 * criado de raspao virava operador.
 *
 * Foi o que aconteceu na VETZ: ao listar as conversas, a rota de mensagens
 * gravava um contato so para cachear a foto de perfil, com role "CLIENTE" e
 * `active` no default `true`. Em 23-24/07/2026 isso cadastrou 38 tutores e
 * desconhecidos como operadores, sem ninguem ter cadastrado nada.
 *
 * Autorizacao agora e por PAPEL, nunca por existencia: so os papeis que o
 * formulario de operadores realmente oferece.
 */
export const PAPEIS_DE_OPERADOR = ["OWNER", "VET", "WORKER"] as const;

export type PapelDeOperador = (typeof PAPEIS_DE_OPERADOR)[number];

export function ehPapelDeOperador(role?: string | null): boolean {
  return !!role && (PAPEIS_DE_OPERADOR as readonly string[]).includes(role);
}
