import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PAPEIS_DE_OPERADOR } from "@/lib/whatsapp/operator-roles";
import { getBase64FromMediaMessage, sendText } from "@/lib/whatsapp/evolution";
import { transcribeAudio, getOpenAiApiKey } from "@/lib/whatsapp/openai";
import { runAgent } from "@/lib/whatsapp/ai/engine";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[webhook payload]", JSON.stringify(payload).slice(0, 500));

    const rawEvent = String(payload.event || payload.type || "").toUpperCase().replace(/\./g, "_");
    const instanceName: string = payload.instance || payload.instanceName || "";

    if (!instanceName) {
      return NextResponse.json({ ok: true, ignored: "Sem instancia" });
    }

    // Busca a conexao e o tenant associados a esta instancia
    const connection = await prisma.whatsappConnection.findFirst({
      where: { instanceName },
      include: { tenant: true },
    });

    if (!connection) {
      return NextResponse.json({ ok: true, ignored: "Instancia nao encontrada" });
    }

    const tenantId = connection.tenantId;

    // 1. Atualizacao de estado da conexao (CONNECTION_UPDATE / connection.update)
    if (rawEvent === "CONNECTION_UPDATE") {
      const state = payload.data?.state || payload.state;
      let newStatus = connection.status;
      if (state === "open") newStatus = "CONNECTED";
      else if (state === "close") newStatus = "DISCONNECTED";
      else if (state === "connecting") newStatus = "CONNECTING";

      await prisma.whatsappConnection.update({
        where: { id: connection.id },
        data: {
          status: newStatus,
          ...(newStatus === "CONNECTED" ? { lastConnectedAt: new Date() } : {}),
        },
      });

      return NextResponse.json({ ok: true, event: rawEvent });
    }

    // 2. Recebimento de mensagens (MESSAGES_UPSERT / messages.upsert)
    if (rawEvent === "MESSAGES_UPSERT") {
      const data = payload.data || payload;
      const key = data.key || payload.key || {};
      const fromMe = Boolean(key.fromMe);

      const remoteJid: string = key.remoteJid || "";
      if (!remoteJid || remoteJid.includes("@g.us")) {
        // Ignorar grupos ou JID em branco
        return NextResponse.json({ ok: true, ignored: "grupo_ou_vazio" });
      }

      const fromPhone = remoteJid.split("@")[0].replace(/\D/g, "");
      if (!fromPhone) {
        return NextResponse.json({ ok: true, ignored: "telefone_invalido" });
      }

      const pushName: string | undefined = data.pushName || payload.pushName;
      const message = data.message || payload.message || {};

      let textContent: string | null =
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        null;

      let isAudio = Boolean(message.audioMessage);

      // Transcricao de audio se recebido
      if (isAudio) {
        try {
          const base64Audio = await getBase64FromMediaMessage(instanceName, message);
          if (base64Audio) {
            const transcribed = await transcribeAudio(base64Audio, message.audioMessage?.mimetype || "audio/ogg");
            if (transcribed) {
              textContent = `[Áudio transcrito]: ${transcribed}`;
            } else {
              textContent = "[Áudio no WhatsApp]";
            }
          }
        } catch (err) {
          console.error("[webhook] erro ao transcrever audio:", err);
          textContent = textContent || "[Áudio no WhatsApp]";
        }
      }

      if (isAudio && !textContent) {
        textContent = "[Áudio enviado no WhatsApp]";
      }

      if (!textContent) {
        return NextResponse.json({ ok: true, ignored: "sem_texto" });
      }

      // Se a mensagem foi enviada pelo proprio celular da clinica (WhatsApp direto no aparelho)
      if (fromMe) {
        const outgoingMsg = await prisma.whatsappMessage.create({
          data: {
            tenantId,
            phone: fromPhone,
            pushName: "Você (WhatsApp)",
            direction: "OUT",
            actor: "HUMAN",
            kind: isAudio ? "AUDIO" : "TEXT",
            content: textContent,
            readAt: new Date(),
          },
        });
        return NextResponse.json({ ok: true, outgoingSaved: outgoingMsg.id });
      }

      // Verifica se o numero e de um operador cadastrado.
      // Filtra por PAPEL: `WhatsappContact` tambem guarda contato comum (a rota de
      // mensagens cria um so para cachear foto de perfil), e sem esse filtro
      // qualquer tutor que trocou mensagem virava operador da clinica.
      const operatorContact = await prisma.whatsappContact.findFirst({
        where: {
          tenantId,
          phone: fromPhone,
          active: true,
          role: { in: [...PAPEIS_DE_OPERADOR] },
        },
      });

      const mode = operatorContact ? "OPERATOR" : "CLIENT";
      const speakerName = operatorContact?.name ?? pushName ?? null;
      const speakerRole = operatorContact?.role ?? null;
      const responsibleUserId = operatorContact?.userId ?? null;

      // Registra a mensagem recebida no banco
      const incomingMsg = await prisma.whatsappMessage.create({
        data: {
          tenantId,
          contactId: operatorContact?.id ?? null,
          phone: fromPhone,
          pushName: pushName ?? null,
          direction: "IN",
          actor: "CONTACT",
          kind: isAudio ? "AUDIO" : "TEXT",
          content: textContent,
        },
      });

      // Checa se a IA esta ativada para este modo
      const isAiEnabled =
        mode === "OPERATOR" ? connection.aiOperatorEnabled : connection.aiClientEnabled;

      let hasOpenAiKey = false;
      try {
        await getOpenAiApiKey();
        hasOpenAiKey = true;
      } catch {
        hasOpenAiKey = false;
      }

      if (!isAiEnabled || !hasOpenAiKey) {
        return NextResponse.json({ ok: true, aiStatus: "disabled", msgId: incomingMsg.id });
      }

function isTestPhoneAllowed(fromPhone: string, allowedList: string[]): boolean {
  const cleanFrom = fromPhone.replace(/\D/g, "");
  const last8From = cleanFrom.slice(-8);

  for (const allowed of allowedList) {
    const cleanAllowed = allowed.replace(/\D/g, "");
    if (cleanFrom === cleanAllowed) return true;
    if (last8From && cleanAllowed.length >= 8 && cleanAllowed.endsWith(last8From)) return true;
  }
  return false;
}

      // MODO DE TESTES: se ativado, responde SOMENTE aos numeros de teste autorizados
      if (connection.aiTestMode && connection.testPhone) {
        const allowedTestPhones = connection.testPhone
          .split(/[\n,;\s]+/)
          .map((p) => p.replace(/\D/g, ""))
          .filter(Boolean);

        if (allowedTestPhones.length > 0 && !isTestPhoneAllowed(fromPhone, allowedTestPhones)) {
          return NextResponse.json({
            ok: true,
            ignored: "modo_de_teste_restrito",
            msgId: incomingMsg.id,
            fromPhone,
            allowedTestPhones,
          });
        }
      }

      // Busca a unidade principal do tenant para contexto
      const unit = await prisma.unit.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!unit) {
        return NextResponse.json({ ok: true, error: "Unidade nao encontrada" });
      }

      const clinicName = connection.tenant.tradeName || connection.tenant.companyName || "Nossa Clinica";
      const extraPrompt = mode === "OPERATOR" ? connection.operatorPrompt : connection.clientPrompt;

      // Executa o agente de IA
      const agentRes = await runAgent({
        mode,
        tenantId,
        unitId: unit.id,
        clinicName,
        phone: fromPhone,
        speakerName,
        speakerRole,
        responsibleUserId,
        text: textContent,
        extraPrompt,
      });

      if (agentRes.reply) {
        // Registra a resposta da IA no banco
        await prisma.whatsappMessage.create({
          data: {
            tenantId,
            contactId: operatorContact?.id ?? null,
            phone: fromPhone,
            pushName: pushName ?? null,
            direction: "OUT",
            actor: "AI",
            kind: "TEXT",
            content: agentRes.reply,
            toolCalls: agentRes.toolNames,
          },
        });

        // Envia resposta via WhatsApp
        await sendText(instanceName, fromPhone, agentRes.reply);
      }

      return NextResponse.json({ ok: true, processed: true, reply: agentRes.reply });
    }

    return NextResponse.json({ ok: true, unhandledEvent: rawEvent });
  } catch (err) {
    console.error("[whatsapp/webhook] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no webhook" },
      { status: 500 }
    );
  }
}
