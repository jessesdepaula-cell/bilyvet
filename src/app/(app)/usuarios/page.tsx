import { prisma } from "@/lib/db";
import { requireModule } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROLE_LABEL, type Role, MODULE_PERMISSIONS, parsePermissions } from "@/lib/permissions";
import { UsersManager } from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const { tenantId, session } = await requireModule("usuarios");
  const [users, units] = await Promise.all([
    prisma.user.findMany({ where: { tenantId }, include: { unit: true }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { tenantId, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Usuarios e permissoes" description="Gerencie acessos ao sistema" tutorialSlug="usuarios" />

      <div className="mb-5">
        <UsersManager
          initial={users.map((u) => ({
            id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive,
            unitId: u.unitId, unit: u.unit ? { id: u.unit.id, name: u.unit.name } : null,
            crmv: u.crmv,
            permissions: parsePermissions(u.permissions),
          }))}
          units={units.map((u) => ({ id: u.id, name: u.name }))}
          currentUserId={session.id}
        />
      </div>

      <div className="card card-pad">
        <h3 className="font-semibold mb-3">Matriz de permissoes</h3>
        <p className="text-xs text-slate-500 mb-3">
          Referencia rapida do que cada perfil acessa. ADMIN tem acesso total exceto super-admin.
        </p>
        <div className="overflow-x-auto">
          <table className="bp-table text-xs">
            <thead><tr><th>Modulo</th>{Object.keys(ROLE_LABEL).filter((r) => r !== "SUPER_ADMIN").map((r) => <th key={r}>{r}</th>)}</tr></thead>
            <tbody>{Object.entries(MODULE_PERMISSIONS).filter(([m]) => m !== "super-admin").map(([m, roles]) => (
              <tr key={m}>
                <td className="font-medium">{m}</td>
                {Object.keys(ROLE_LABEL).filter((r) => r !== "SUPER_ADMIN").map((r) => (
                  <td key={r} className="text-center">{r === "ADMIN" || roles.includes(r as Role) ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">-</span>}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
