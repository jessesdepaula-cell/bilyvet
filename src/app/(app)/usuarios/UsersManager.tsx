"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Mail, Power, Pencil, Check, Shield } from "lucide-react";
import { ROLE_LABEL, type Role, defaultPermissionsForRole, effectivePermissions } from "@/lib/permissions";
import { PermissionsMatrix } from "./PermissionsMatrix";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  unitId: string | null;
  unit?: { id: string; name: string } | null;
  crmv: string | null;
  permissions: string[] | null;
};

type Unit = { id: string; name: string };

const ROLES_PRA_CRIAR: Role[] = ["ADMIN", "GESTOR", "VETERINARIO", "RECEPCAO", "FINANCEIRO", "ESTOQUE", "BANHO_TOSA", "VENDEDOR"];

export function UsersManager({ initial, units, currentUserId }: { initial: User[]; units: Unit[]; currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    role: "RECEPCAO" as Role,
    unitId: units[0]?.id || "",
    crmv: "",
    permissions: defaultPermissionsForRole("RECEPCAO"),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; link?: string; emailSent: boolean } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ role: string; unitId: string; crmv: string; permissions: string[] }>({ role: "", unitId: "", crmv: "", permissions: [] });
  const [showAdvanced, setShowAdvanced] = useState(false);

  function startCreate() {
    setCreating(true);
    setResult(null);
    setShowAdvanced(false);
    setDraft({ name: "", email: "", role: "RECEPCAO", unitId: units[0]?.id || "", crmv: "", permissions: defaultPermissionsForRole("RECEPCAO") });
  }

  function changeRoleInDraft(role: Role) {
    // Ao trocar role, sugere as permissoes padrao desse role
    setDraft((d) => ({ ...d, role, permissions: defaultPermissionsForRole(role) }));
  }

  async function createUser() {
    if (!draft.name.trim() || !draft.email.trim()) { setError("Nome e email obrigatorios"); return; }
    setBusy(true); setError(null); setResult(null);
    try {
      const isCustom = JSON.stringify(draft.permissions.sort()) !== JSON.stringify(defaultPermissionsForRole(draft.role).sort());
      const payload = {
        name: draft.name,
        email: draft.email,
        role: draft.role,
        unitId: draft.unitId,
        crmv: draft.crmv,
        permissions: isCustom ? draft.permissions : null,
      };
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha ao criar usuario");
      const newUser: User = {
        id: j.user.id, name: j.user.name, email: j.user.email, role: j.user.role,
        isActive: j.user.isActive, unitId: j.user.unitId, crmv: j.user.crmv ?? null,
        unit: units.find((u) => u.id === j.user.unitId) ?? null,
        permissions: isCustom ? draft.permissions : null,
      };
      setUsers((arr) => [...arr, newUser].sort((a, b) => a.name.localeCompare(b.name)));
      setResult({ email: j.user.email, link: j.invite?.link, emailSent: !!j.invite?.emailSent });
      setCreating(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: User) {
    if (u.id === currentUserId) { alert("Voce nao pode desativar a si mesmo."); return; }
    const action = u.isActive ? "Desativar" : "Reativar";
    if (!confirm(`${action} usuario ${u.email}?`)) return;
    if (u.isActive) {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, isActive: false } : x)));
        router.refresh();
      }
    } else {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, isActive: true } : x)));
        router.refresh();
      }
    }
  }

  function startEdit(u: User) {
    setEditId(u.id);
    const eff = effectivePermissions(u.role, u.permissions);
    setEditDraft({ role: u.role, unitId: u.unitId || "", crmv: u.crmv ?? "", permissions: [...eff] });
  }

  async function saveEdit(id: string, u: User) {
    setBusy(true); setError(null);
    try {
      const defaults = defaultPermissionsForRole(editDraft.role);
      const isCustom = JSON.stringify([...editDraft.permissions].sort()) !== JSON.stringify([...defaults].sort());
      const payload = {
        role: editDraft.role,
        unitId: editDraft.unitId || null,
        crmv: editDraft.crmv,
        permissions: isCustom ? editDraft.permissions : null,
      };
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha");
      setUsers((arr) => arr.map((x) => (x.id === id ? {
        ...x, role: j.role, unitId: j.unitId, crmv: j.crmv ?? null,
        unit: units.find((un) => un.id === j.unitId) ?? null,
        permissions: isCustom ? editDraft.permissions : null,
      } : x)));
      setEditId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Crie acessos para sua equipe. O usuario recebe email com link para definir a propria senha. Voce escolhe exatamente quais modulos cada um pode acessar.
        </p>
        {!creating && (
          <button className="btn-primary text-sm shrink-0" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Novo usuario
          </button>
        )}
      </div>

      {result && (
        <div className="card card-pad bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-2">
            <Mail className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">Usuario criado.</p>
              {result.emailSent ? (
                <p className="text-sm text-emerald-800">Email com link de definicao de senha enviado para <b>{result.email}</b>.</p>
              ) : (
                <>
                  <p className="text-sm text-amber-800 mb-2">Falha ao enviar email. Encaminhe este link para <b>{result.email}</b>:</p>
                  {result.link && (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono break-all">{result.link}</div>
                  )}
                  {result.link && (
                    <button className="btn-outline text-xs mt-2" onClick={() => navigator.clipboard.writeText(result.link!)}>
                      Copiar link
                    </button>
                  )}
                </>
              )}
            </div>
            <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {creating && (
        <div className="card card-pad bg-amber-50 border-amber-200 space-y-4">
          <h3 className="font-semibold text-slate-800">Novo usuario</h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input className="input" autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex: Maria Recepcao" />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="maria@clinica.com.br" />
            </div>
            <div>
              <label className="label">Perfil *</label>
              <select className="input" value={draft.role} onChange={(e) => changeRoleInDraft(e.target.value as Role)}>
                {ROLES_PRA_CRIAR.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">O perfil sugere as permissoes padrao - voce pode ajustar abaixo.</p>
            </div>
            <div>
              <label className="label">Unidade</label>
              <select className="input" value={draft.unitId} onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">CRMV</label>
              <input className="input" value={draft.crmv} onChange={(e) => setDraft({ ...draft, crmv: e.target.value })} placeholder="Ex: RJ 17.412" />
              <p className="text-xs text-slate-500 mt-1">Usado na assinatura das receitas emitidas por este veterinario.</p>
            </div>
          </div>

          <div className="border-t border-amber-200 pt-3">
            <button
              type="button"
              className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1 mb-3"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <Shield className="h-4 w-4" />
              {showAdvanced ? "Ocultar" : "Personalizar"} permissoes
              <span className="text-xs text-slate-400 ml-1">
                ({draft.role === "ADMIN" ? "acesso total" : `${draft.permissions.length} modulo(s) liberado(s)`})
              </span>
            </button>
            {showAdvanced && (
              <PermissionsMatrix
                role={draft.role}
                selected={draft.permissions}
                onChange={(next) => setDraft({ ...draft, permissions: next })}
              />
            )}
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setCreating(false); setError(null); }} className="btn-outline text-sm">Cancelar</button>
            <button onClick={createUser} disabled={busy} className="btn-primary text-sm">
              {busy ? "Criando..." : "Criar e enviar convite"}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="bp-table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>CRMV</th><th>Unidade</th><th>Permissoes</th><th>Status</th><th></th></tr></thead>
          <tbody>{users.map((u) => {
            const editing = editId === u.id;
            const eff = effectivePermissions(u.role, u.permissions);
            const isCustom = u.permissions !== null && u.permissions.length > 0 && u.role !== "ADMIN";
            return (
              <>
                <tr key={u.id} className={u.isActive ? "" : "opacity-60"}>
                  <td className="font-medium">{u.name}{u.id === currentUserId && <span className="text-xs text-slate-400 ml-1">(voce)</span>}</td>
                  <td className="text-slate-600">{u.email}</td>
                  <td>
                    {editing ? (
                      <select className="input text-xs" value={editDraft.role} onChange={(e) => {
                        const r = e.target.value;
                        setEditDraft({ ...editDraft, role: r, permissions: defaultPermissionsForRole(r) });
                      }}>
                        {ROLES_PRA_CRIAR.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="badge-blue">{ROLE_LABEL[u.role as Role] ?? u.role}</span>
                    )}
                  </td>
                  <td className="text-xs text-slate-600">
                    {editing ? (
                      <input className="input text-xs" value={editDraft.crmv} placeholder="RJ 17.412" onChange={(e) => setEditDraft({ ...editDraft, crmv: e.target.value })} />
                    ) : (
                      u.crmv || "-"
                    )}
                  </td>
                  <td>
                    {editing ? (
                      <select className="input text-xs" value={editDraft.unitId} onChange={(e) => setEditDraft({ ...editDraft, unitId: e.target.value })}>
                        <option value="">-</option>
                        {units.map((un) => <option key={un.id} value={un.id}>{un.name}</option>)}
                      </select>
                    ) : (
                      u.unit?.name ?? "-"
                    )}
                  </td>
                  <td className="text-xs text-slate-600">
                    {u.role === "ADMIN" ? (
                      <span className="badge-blue">acesso total</span>
                    ) : isCustom ? (
                      <span className="badge-orange" title={eff.join(", ")}>{eff.length} modulos (customizado)</span>
                    ) : (
                      <span className="badge-gray" title={eff.join(", ")}>{eff.length} modulos (padrao do perfil)</span>
                    )}
                  </td>
                  <td>{u.isActive ? <span className="badge-green">ativo</span> : <span className="badge-gray">inativo</span>}</td>
                  <td className="text-right whitespace-nowrap">
                    {editing ? (
                      <>
                        <button onClick={() => saveEdit(u.id, u)} disabled={busy} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Salvar"><Check className="h-4 w-4" /></button>
                        <button onClick={() => { setEditId(null); setError(null); }} className="text-slate-500 p-1 rounded" title="Cancelar"><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)} className="text-slate-500 hover:text-brand-600 p-1" title="Editar perfil, unidade e permissoes"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => toggleActive(u)} className="text-slate-500 hover:text-red-600 p-1" title={u.isActive ? "Desativar" : "Reativar"}><Power className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </td>
                </tr>
                {editing && (
                  <tr key={u.id + "-perms"}>
                    <td colSpan={8} className="bg-amber-50/50 border-t-0">
                      <div className="py-3">
                        <PermissionsMatrix
                          role={editDraft.role}
                          selected={editDraft.permissions}
                          onChange={(next) => setEditDraft({ ...editDraft, permissions: next })}
                        />
                        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mt-3">{error}</div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
