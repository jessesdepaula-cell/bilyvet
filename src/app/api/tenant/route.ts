import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantApi, isTenantError } from "@/lib/tenant";

export const runtime = "nodejs";

// Logo vai como data URI direto na coluna (logo de clinica e pequena).
// jsPDF so renderiza PNG/JPEG com seguranca - por isso o webp fica de fora.
const LOGO_PREFIX = /^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/;
const LOGO_MAX_BYTES = 1_500_000;

const TEXT_FIELDS = [
  "companyName", "tradeName", "cnpj", "email",
  "phone", "address", "city", "state", "zipCode",
] as const;

const SELECT = {
  id: true, companyName: true, tradeName: true, cnpj: true, email: true,
  phone: true, address: true, city: true, state: true, zipCode: true, logoUrl: true,
};

export async function GET() {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const t = await prisma.tenant.findUnique({ where: { id: ctx.tenantId }, select: SELECT });
  if (!t) return NextResponse.json({ error: "Clinica nao encontrada" }, { status: 404 });
  return NextResponse.json(t);
}

export async function PATCH(req: Request) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!["ADMIN", "GESTOR", "SUPER_ADMIN"].includes(ctx.session.role)) {
    return NextResponse.json({ error: "Apenas ADMIN/GESTOR podem editar os dados da clinica" }, { status: 403 });
  }

  const b = await req.json();
  const data: any = {};

  for (const f of TEXT_FIELDS) {
    if (b[f] === undefined) continue;
    const v = String(b[f] ?? "").trim();
    if (f === "companyName" || f === "email") {
      if (!v) return NextResponse.json({ error: "Razao social e e-mail sao obrigatorios" }, { status: 400 });
      data[f] = v;
    } else if (f === "state") {
      data[f] = v ? v.toUpperCase().slice(0, 2) : null;
    } else {
      data[f] = v || null;
    }
  }

  if (b.logoUrl !== undefined) {
    if (b.logoUrl === null || b.logoUrl === "") {
      data.logoUrl = null;
    } else {
      const url = String(b.logoUrl);
      if (!LOGO_PREFIX.test(url)) {
        return NextResponse.json({ error: "Logo invalida. Envie um PNG ou JPG." }, { status: 400 });
      }
      if (url.length > LOGO_MAX_BYTES) {
        return NextResponse.json({ error: "Logo muito grande (maximo ~1MB). Use uma imagem menor." }, { status: 400 });
      }
      data.logoUrl = url;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  try {
    const t = await prisma.tenant.update({ where: { id: ctx.tenantId }, data, select: SELECT });
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId, userId: ctx.session.id, action: "UPDATE",
        entity: "Tenant", entityId: t.id,
        details: "Dados da clinica" + (data.logoUrl !== undefined ? " (logo)" : ""),
      },
    }).catch(() => {});
    return NextResponse.json(t);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Ja existe outra clinica com este CNPJ" }, { status: 409 });
    }
    throw err;
  }
}
