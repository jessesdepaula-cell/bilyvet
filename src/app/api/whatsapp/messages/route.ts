import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantApi, isTenantError } from "@/lib/tenant";
import { sendText, instanceNameForTenant, fetchProfilePictureUrl } from "@/lib/whatsapp/evolution";

function normalizePhone(p: string): string {
  let digits = p.replace(/\D/g, "");
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return digits;
}

export async function GET(req: Request) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { tenantId } = ctx;
  const instanceName = instanceNameForTenant(tenantId);
  const { searchParams } = new URL(req.url);
  const chatPhone = searchParams.get("phone");

  try {
    // Se foi passado um telefone especifico, retorna o historico de mensagens dessa conversa
    if (chatPhone) {
      const cleanPhone = normalizePhone(chatPhone);
      const messages = await prisma.whatsappMessage.findMany({
        where: { tenantId, phone: cleanPhone },
        orderBy: { createdAt: "asc" },
        take: 150,
      });

      // Marcar mensagens recebidas como lidas
      await prisma.whatsappMessage.updateMany({
        where: { tenantId, phone: cleanPhone, direction: "IN", readAt: null },
        data: { readAt: new Date() },
      });

      // Busca informacoes do contato ou tutor associado
      const last8 = cleanPhone.slice(-8);
      const [operatorContact, tutor] = await Promise.all([
        prisma.whatsappContact.findFirst({
          where: {
            tenantId,
            OR: [{ phone: cleanPhone }, { phone: { endsWith: last8 } }],
          },
        }),
        prisma.tutor.findFirst({
          where: {
            tenantId,
            OR: [
              { phone: cleanPhone },
              { whatsapp: cleanPhone },
              { phone: { endsWith: last8 } },
              { whatsapp: { endsWith: last8 } },
            ],
          },
          include: { pets: { select: { id: true, name: true, species: true } } },
        }),
      ]);

      let profilePicUrl = operatorContact?.profilePicUrl || null;
      if (!profilePicUrl) {
        try {
          profilePicUrl = await fetchProfilePictureUrl(instanceName, cleanPhone);
          if (profilePicUrl && operatorContact) {
            await prisma.whatsappContact.update({
              where: { id: operatorContact.id },
              data: { profilePicUrl },
            }).catch(() => {});
          }
        } catch (err) {
          console.error("[whatsapp/messages] erro ao buscar foto de perfil:", err);
        }
      }

      return NextResponse.json({
        phone: cleanPhone,
        messages,
        contactInfo: {
          name: operatorContact?.name ?? tutor?.name ?? null,
          role: operatorContact?.role ?? (tutor ? "CLIENTE" : "DESCONHECIDO"),
          pets: tutor?.pets ?? [],
          profilePicUrl,
          isOperator: Boolean(operatorContact?.active),
        },
      });
    }

    // Lista de conversas ativas (agrupadas por telefone)
    const recentMessages = await prisma.whatsappMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const conversationMap = new Map<string, {
      phone: string;
      pushName: string | null;
      lastMessage: string;
      lastMessageAt: Date;
      direction: string;
      actor: string;
      unreadCount: number;
    }>();

    for (const msg of recentMessages) {
      if (!conversationMap.has(msg.phone)) {
        conversationMap.set(msg.phone, {
          phone: msg.phone,
          pushName: msg.pushName ?? null,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          direction: msg.direction,
          actor: msg.actor,
          unreadCount: 0,
        });
      }

      if (msg.direction === "IN" && !msg.readAt) {
        const item = conversationMap.get(msg.phone)!;
        item.unreadCount += 1;
      }
    }

    const conversationsList = Array.from(conversationMap.values());

    // Cruzar com os nomes cadastrados de tutores e operadores
    const phones = conversationsList.map((c) => c.phone);
    const [operatorContacts, allTutors] = await Promise.all([
      prisma.whatsappContact.findMany({
        where: { tenantId, phone: { in: phones } },
      }),
      prisma.tutor.findMany({
        where: { tenantId },
        select: { name: true, phone: true, whatsapp: true },
      }),
    ]);

    const opMap = new Map(operatorContacts.map((c) => [c.phone, c]));
    const tutorMap = new Map<string, string>();
    for (const t of allTutors) {
      if (t.phone) {
        const norm = normalizePhone(t.phone);
        tutorMap.set(norm, t.name);
        if (norm.length >= 8) tutorMap.set(norm.slice(-8), t.name);
      }
      if (t.whatsapp) {
        const norm = normalizePhone(t.whatsapp);
        tutorMap.set(norm, t.name);
        if (norm.length >= 8) tutorMap.set(norm.slice(-8), t.name);
      }
    }

    const conversations = await Promise.all(
      conversationsList.map(async (c) => {
        const op = opMap.get(c.phone);
        const tutorName = tutorMap.get(c.phone) ?? tutorMap.get(c.phone.slice(-8));
        const displayName = op?.name ?? tutorName ?? c.pushName ?? c.phone;
        const role = op ? `EQUIPE (${op.role})` : tutorName ? "CLIENTE" : "DESCONHECIDO";

        let profilePicUrl = op?.profilePicUrl || null;
        if (!profilePicUrl) {
          try {
            profilePicUrl = await fetchProfilePictureUrl(instanceName, c.phone);
            if (profilePicUrl) {
              if (op) {
                await prisma.whatsappContact.update({
                  where: { id: op.id },
                  data: { profilePicUrl },
                }).catch(() => {});
              } else {
                // ATENCAO: este upsert existe SO para cachear a foto de perfil.
                // O papel tem que continuar fora de PAPEIS_DE_OPERADOR - a mesma
                // tabela autoriza quem alimenta o sistema pela IA, e usar um papel
                // de operador aqui transformaria em operador todo mundo que trocou
                // mensagem com a clinica (foi o que aconteceu na VETZ em 07/2026).
                await prisma.whatsappContact.upsert({
                  where: { tenantId_phone: { tenantId, phone: c.phone } },
                  create: {
                    tenantId,
                    name: c.pushName || displayName || c.phone,
                    phone: c.phone,
                    role: "CLIENTE",
                    profilePicUrl,
                  },
                  update: { profilePicUrl },
                }).catch(() => {});
              }
            }
          } catch (err) {
            // Falha silenciosa se nao encontrar foto
          }
        }

        return {
          ...c,
          displayName,
          role,
          profilePicUrl,
          isOperator: Boolean(op),
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[whatsapp/messages] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar mensagens" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { tenantId } = ctx;
  const instanceName = instanceNameForTenant(tenantId);

  try {
    const body = await req.json();
    const { phone, text } = body;

    if (!phone || !text?.trim()) {
      return NextResponse.json({ error: "Telefone e mensagem sao obrigatorios" }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    // Envia a mensagem pelo WhatsApp
    const sendRes = await sendText(instanceName, cleanPhone, text.trim());

    if (!sendRes.ok) {
      return NextResponse.json(
        { error: `Falha ao enviar mensagem pelo WhatsApp (${sendRes.status})` },
        { status: 500 }
      );
    }

    // Registra a mensagem enviada pelo humano no banco
    const createdMsg = await prisma.whatsappMessage.create({
      data: {
        tenantId,
        phone: cleanPhone,
        direction: "OUT",
        actor: "HUMAN",
        kind: "TEXT",
        content: text.trim(),
      },
    });

    return NextResponse.json({ ok: true, message: createdMsg });
  } catch (err) {
    console.error("[whatsapp/messages POST] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
