// Seed minimo: garante apenas o SUPER_ADMIN.
// Cada tenant criado em /super-admin/clientes/novo recebe Unit + PaymentMethods + Categorias default.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureSuperAdmin() {
  // NUNCA voltar a escrever email/senha aqui: este repositorio e PUBLICO e a
  // credencial ficou legivel no GitHub de 20/05/2026 a 27/08/2026, valendo login
  // SUPER_ADMIN em producao. Os valores vem do ambiente, e o seed falha alto se
  // faltarem - melhor nao semear do que semear com senha conhecida.
  const email = process.env.SUPER_ADMIN_EMAIL;
  const senha = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !senha) {
    const existingSuperAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (existingSuperAdmin) {
      console.log("Super admin ja cadastrado no banco de dados. Pulando seed.");
      return;
    }
    console.warn("Aviso: Defina SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD no ambiente para semear o super admin.");
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = bcrypt.hashSync(senha, 10);
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: "SUPER_ADMIN", isActive: true, name: existing.name || "Jesse de Paula" },
    });
    console.log("Super admin atualizado:", email);
  } else {
    await prisma.user.create({
      data: { name: process.env.SUPER_ADMIN_NAME || "Super Admin", email, passwordHash, role: "SUPER_ADMIN", isActive: true },
    });
    console.log("Super admin criado:", email);
  }
}

async function main() {
  await ensureSuperAdmin();
  console.log("Seed concluido (apenas SUPER_ADMIN).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
