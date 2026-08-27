"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = "5521997267809";
const WHATSAPP_MESSAGE = "Ola! Vim pelo sistema BilyVet e preciso de suporte.";

/**
 * Rotas onde o botao de suporte aparece. E uma LISTA BRANCA de propósito: a area
 * logada vive no route group `(app)`, que nao aparece na URL, entao nao da para
 * detectar "e pagina do app" por prefixo - as rotas internas sao dezenas
 * (/dashboard, /pets, /agenda, /configuracoes...) e qualquer nova escaparia de
 * uma lista negra. As publicas, ao contrario, sao poucas e estaveis.
 */
const ROTAS_PUBLICAS = ["/", "/checkout", "/login", "/recuperar-senha", "/redefinir-senha"];

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const ehPublica = ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  // Dentro da area de membros o cliente fala com a clinica pelo proprio sistema;
  // este botao e de suporte comercial e so faz sentido antes do login.
  if (!ehPublica) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com suporte no WhatsApp"
      className="group fixed bottom-5 right-5 z-[60] flex items-center rounded-full bg-[#25D366] p-3.5 text-white shadow-2xl shadow-emerald-900/30 transition hover:bg-[#1EBE5A] hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <span aria-hidden className="absolute inset-0 -z-10 rounded-full bg-[#25D366] opacity-60 animate-ping" />
      <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.02 12.02 0 0 0 5.705 1.448h.005c6.582 0 11.941-5.335 11.944-11.893 0-3.176-1.24-6.165-3.494-8.411m-8.475 18.29h-.004a9.98 9.98 0 0 1-5.077-1.387l-.365-.216-3.775.986 1.008-3.667-.237-.376a9.86 9.86 0 0 1-1.516-5.281c.002-5.452 4.455-9.887 9.928-9.887a9.86 9.86 0 0 1 7.017 2.899 9.78 9.78 0 0 1 2.909 6.994c-.003 5.452-4.456 9.887-9.928 9.887" />
      </svg>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:ml-3 group-hover:max-w-xs sm:inline">
        Suporte no WhatsApp
      </span>
    </a>
  );
}
