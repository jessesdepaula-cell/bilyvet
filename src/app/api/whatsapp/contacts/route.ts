import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantApi, isTenantError } from "@/lib/tenant";
import { PAPEIS_DE_OPERADOR } from "@/lib/whatsapp/operator-roles";

export async function GET() {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { tenantId } = ctx;

  try {
    // So papel de operador: contatos criados de raspao pelo cache de foto de
    // perfil (role "CLIENTE") nao sao operadores e nao entram nesta lista.
    const contacts = await prisma.whatsappContact.findMany({
      where: { tenantId, role: { in: [...PAPEIS_DE_OPERADOR] } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar contatos" },
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

  try {
    const body = await req.json();
    const { name, phone, role, userId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nome e telefone sao obrigatorios" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Telefone invalido. Informe DDI + DDD + Numero" }, { status: 400 });
    }

    const contact = await prisma.whatsappContact.upsert({
      where: {
        tenantId_phone: { tenantId, phone: cleanPhone },
      },
      create: {
        tenantId,
        name,
        phone: cleanPhone,
        role: role || "WORKER",
        userId: userId || null,
        active: true,
      },
      update: {
        name,
        role: role || "WORKER",
        userId: userId || null,
        active: true,
      },
    });

    return NextResponse.json({ ok: true, contact });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar contato" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { tenantId } = ctx;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do contato nao informado" }, { status: 400 });
    }

    await prisma.whatsappContact.deleteMany({
      where: { id, tenantId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao remover contato" },
      { status: 500 }
    );
  }
}
