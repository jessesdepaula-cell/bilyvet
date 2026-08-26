import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireTenantApi, isTenantError } from "@/lib/tenant";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { ALL_MODULE_SLUGS } from "@/lib/permissions";

const ALLOWED_ROLES = ["ADMIN", "GESTOR", "VETERINARIO", "RECEPCAO", "FINANCEIRO", "ESTOQUE", "BANHO_TOSA", "VENDEDOR"];

function sanitizePermissions(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const valid = raw.filter((x: any): x is string => typeof x === "string" && ALL_MODULE_SLUGS.includes(x));
  return Array.from(new Set(valid));
}

function getAppUrl(req: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET() {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const list = await prisma.user.findMany({
    where: { tenantId: ctx.tenantId },
    include: { unit: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  // Apenas ADMIN ou GESTOR podem criar
  if (!["ADMIN", "GESTOR"].includes(ctx.session.role)) {
    return NextResponse.json({ error: "Apenas ADMIN/GESTOR podem criar usuarios" }, { status: 403 });
  }

  const b = await req.json();
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const role = String(b.role || "");
  if (!name || !email || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Dados invalidos (nome, email e perfil sao obrigatorios)" }, { status: 400 });
  }

  // Email unico
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Ja existe um usuario com este email" }, { status: 409 });

  // Unit do tenant (opcional - se nao informada, usa a primeira do tenant)
  let unitId = b.unitId || null;
  if (unitId) {
    const unit = await prisma.unit.findFirst({ where: { id: unitId, tenantId: ctx.tenantId } });
    if (!unit) return NextResponse.json({ error: "Unidade invalida" }, { status: 400 });
  } else {
    unitId = ctx.unitId;
  }

  const placeholderHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 10);
  // Permissoes customizadas (opcional). Se vazio/null, sistema usa o padrao do role.
  const customPermissions = sanitizePermissions(b.permissions);
  const user = await prisma.user.create({
    data: {
      tenantId: ctx.tenantId,
      unitId,
      name,
      email,
      role,
      passwordHash: placeholderHash,
      crmv: String(b.crmv || "").trim() || null,
      isActive: true,
      permissions: customPermissions ? JSON.stringify(customPermissions) : null,
    },
  });

  // Gera token + dispara email
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { token, email, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const link = `${getAppUrl(req)}/redefinir-senha?token=${token}`;
  const { html, text } = passwordResetEmail({ link, isNewAccount: true });
  const sendResult = await sendEmail({
    to: email,
    subject: "Bem-vindo a BilyVet - defina sua senha",
    html,
    text,
  });

  await prisma.auditLog.create({ data: { tenantId: ctx.tenantId, userId: ctx.session.id, action: "CREATE", entity: "User", entityId: user.id, details: `${email} (${role})` } });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, unitId: user.unitId, crmv: user.crmv, isActive: user.isActive },
    invite: {
      link,
      emailSent: sendResult.ok,
      emailError: sendResult.ok ? undefined : sendResult.error,
    },
  });
}
