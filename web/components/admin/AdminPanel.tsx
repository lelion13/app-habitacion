"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { SYSTEM_ROLE_LABELS, type SystemRole } from "@/lib/types";
import {
  staffBtnGhost,
  staffBtnPrimary,
  staffBtnSecondary,
  staffCard,
  staffContent,
  staffError,
  staffInput,
  staffTabActive,
  staffTabInactive,
  staffText,
  staffTitle,
} from "@/lib/staff-theme";

type AdminTab = "users" | "floors" | "sectors" | "rooms";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  active: boolean;
}

interface AdminFloor {
  id: string;
  name: string;
  label: string;
  active: boolean;
}

interface AdminSector {
  id: string;
  code: string;
  label: string;
  active: boolean;
}

interface AdminRoom {
  id: string;
  number: string;
  label: string;
  roomKey: string;
  floorId: string | null;
  sectorId: string | null;
  floor: string;
  sector: string;
  active: boolean;
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: "users", label: "Usuarios" },
  { id: "floors", label: "Pisos" },
  { id: "sectors", label: "Sectores" },
  { id: "rooms", label: "Habitaciones" },
];

export function AdminPanel() {
  const { token } = useApp();
  const [tab, setTab] = useState<AdminTab>("users");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [floors, setFloors] = useState<AdminFloor[]>([]);
  const [sectors, setSectors] = useState<AdminSector[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!token) throw new Error("No autenticado");
      const res = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error de servidor");
      return data;
    },
    [token],
  );

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [usersData, floorsData, sectorsData, roomsData] = await Promise.all([
        apiFetch("/api/admin/users?includeInactive=true") as Promise<{ users: AdminUser[] }>,
        apiFetch("/api/admin/floors?includeInactive=true") as Promise<{ floors: AdminFloor[] }>,
        apiFetch("/api/admin/sectors?includeInactive=true") as Promise<{ sectors: AdminSector[] }>,
        apiFetch("/api/admin/rooms?includeInactive=true") as Promise<{ rooms: AdminRoom[] }>,
      ]);
      setUsers(usersData.users);
      setFloors(floorsData.floors);
      setSectors(sectorsData.sectors);
      setRooms(roomsData.rooms);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      systemRole: String(formData.get("systemRole") ?? "user"),
      password: String(formData.get("password") ?? ""),
    };

    try {
      if (editingUserId) {
        const body: Record<string, string | boolean> = {
          name: payload.name,
          systemRole: payload.systemRole,
        };
        if (payload.password) body.password = payload.password;
        const active = formData.get("active") === "on";
        body.active = active;
        await apiFetch(`/api/admin/users/${editingUserId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingUserId(null);
      formEl.reset();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar usuario");
    }
  }

  async function handleFloorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      label: String(formData.get("label") ?? "").trim(),
    };
    try {
      if (editingFloorId) {
        await apiFetch(`/api/admin/floors/${editingFloorId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...payload,
            active: formData.get("active") === "on",
          }),
        });
      } else {
        await apiFetch("/api/admin/floors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingFloorId(null);
      formEl.reset();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar piso");
    }
  }

  async function handleSectorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      label: String(formData.get("label") ?? "").trim(),
    };
    try {
      if (editingSectorId) {
        await apiFetch(`/api/admin/sectors/${editingSectorId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...payload,
            active: formData.get("active") === "on",
          }),
        });
      } else {
        await apiFetch("/api/admin/sectors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingSectorId(null);
      formEl.reset();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar sector");
    }
  }

  async function handleRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const payload = {
      number: String(formData.get("number") ?? "").trim(),
      label: String(formData.get("label") ?? "").trim(),
      floorId: String(formData.get("floorId") ?? ""),
      sectorId: String(formData.get("sectorId") ?? ""),
    };
    try {
      if (editingRoomId) {
        await apiFetch(`/api/admin/rooms/${editingRoomId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...payload,
            active: formData.get("active") === "on",
          }),
        });
      } else {
        await apiFetch("/api/admin/rooms", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingRoomId(null);
      formEl.reset();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar habitación");
    }
  }

  const editingUser = users.find((u) => u.id === editingUserId);
  const editingFloor = floors.find((f) => f.id === editingFloorId);
  const editingSector = sectors.find((s) => s.id === editingSectorId);
  const editingRoom = rooms.find((r) => r.id === editingRoomId);
  const activeFloors = floors.filter((f) => f.active);
  const activeSectors = sectors.filter((s) => s.active);

  return (
    <main className={staffContent}>
      <PageHeader
        title="Administración"
        subtitle="Usuarios, pisos, sectores y habitaciones"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tab === item.id ? staffTabActive : staffTabInactive}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className={`mb-4 ${staffError}`}>{error}</p>
      )}
      {loading && <p className={`mb-4 ${staffText}`}>Cargando…</p>}

      {tab === "users" && (
        <section className="space-y-6">
          <form
            key={editingUserId ?? "new-user"}
            onSubmit={(e) => void handleUserSubmit(e)}
            className={staffCard}
          >
            <h2 className={`mb-4 ${staffTitle}`}>
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="email"
                type="email"
                required
                readOnly={Boolean(editingUser)}
                defaultValue={editingUser?.email ?? ""}
                placeholder="Email"
                className={staffInput}
              />
              <input
                name="name"
                required
                defaultValue={editingUser?.name ?? ""}
                placeholder="Nombre"
                className={staffInput}
              />
              <select
                name="systemRole"
                defaultValue={editingUser?.systemRole ?? "user"}
                className={staffInput}
              >
                {(Object.keys(SYSTEM_ROLE_LABELS) as SystemRole[]).map((role) => (
                  <option key={role} value={role}>
                    {SYSTEM_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <input
                name="password"
                type="password"
                required={!editingUser}
                placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                className={staffInput}
              />
              {editingUser && (
                <label className="flex items-center gap-2 text-sm text-[#7a9ab5] sm:col-span-2">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editingUser.active}
                  />
                  Activo
                </label>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className={`${staffBtnPrimary}`}
              >
                {editingUser ? "Guardar cambios" : "Crear usuario"}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className={staffBtnSecondary}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className={`flex flex-wrap items-center justify-between gap-2 ${staffCard}`}
              >
                <div>
                  <p className="font-semibold text-[#f0f4f8]">{user.name}</p>
                  <p className="text-sm text-[#7a9ab5]">
                    {user.email} · {SYSTEM_ROLE_LABELS[user.systemRole]}
                    {!user.active && " · Inactivo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUserId(user.id)}
                  className="text-sm font-medium text-[#5ee9b5] hover:underline"
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "floors" && (
        <section className="space-y-6">
          <form
            key={editingFloorId ?? "new-floor"}
            onSubmit={(e) => void handleFloorSubmit(e)}
            className={staffCard}
          >
            <h2 className={`mb-4 ${staffTitle}`}>
              {editingFloor ? "Editar piso" : "Nuevo piso"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="name"
                required
                defaultValue={editingFloor?.name ?? ""}
                placeholder="Nombre (ej. 1)"
                className={staffInput}
              />
              <input
                name="label"
                required
                defaultValue={editingFloor?.label ?? ""}
                placeholder="Etiqueta (ej. Piso 1)"
                className={staffInput}
              />
              {editingFloor && (
                <label className="flex items-center gap-2 text-sm text-[#7a9ab5] sm:col-span-2">
                  <input name="active" type="checkbox" defaultChecked={editingFloor.active} />
                  Activo
                </label>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className={staffBtnPrimary}
              >
                {editingFloor ? "Guardar" : "Crear piso"}
              </button>
              {editingFloor && (
                <button type="button" onClick={() => setEditingFloorId(null)} className={staffBtnSecondary}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <ul className="space-y-2">
            {floors.map((floor) => (
              <li key={floor.id} className={`flex justify-between ${staffCard}`}>
                <span>
                  {floor.label} ({floor.name}){!floor.active && " · Inactivo"}
                </span>
                <button type="button" onClick={() => setEditingFloorId(floor.id)} className="text-sm text-[#5ee9b5]">
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "sectors" && (
        <section className="space-y-6">
          <form
            key={editingSectorId ?? "new-sector"}
            onSubmit={(e) => void handleSectorSubmit(e)}
            className={staffCard}
          >
            <h2 className={`mb-4 ${staffTitle}`}>
              {editingSector ? "Editar sector" : "Nuevo sector"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="code"
                required
                defaultValue={editingSector?.code ?? ""}
                placeholder="Código (ej. A)"
                className={staffInput}
              />
              <input
                name="label"
                required
                defaultValue={editingSector?.label ?? ""}
                placeholder="Etiqueta"
                className={staffInput}
              />
              {editingSector && (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input name="active" type="checkbox" defaultChecked={editingSector.active} />
                  Activo
                </label>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className={staffBtnPrimary}>
                {editingSector ? "Guardar" : "Crear sector"}
              </button>
              {editingSector && (
                <button type="button" onClick={() => setEditingSectorId(null)} className={staffBtnSecondary}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <ul className="space-y-2">
            {sectors.map((sector) => (
              <li key={sector.id} className={`flex justify-between ${staffCard}`}>
                <span>
                  {sector.label} ({sector.code}){!sector.active && " · Inactivo"}
                </span>
                <button type="button" onClick={() => setEditingSectorId(sector.id)} className="text-sm text-[#5ee9b5]">
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "rooms" && (
        <section className="space-y-6">
          <form
            key={editingRoomId ?? "new-room"}
            onSubmit={(e) => void handleRoomSubmit(e)}
            className={staffCard}
          >
            <h2 className={`mb-4 ${staffTitle}`}>
              {editingRoom ? "Editar habitación" : "Nueva habitación"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="number"
                required
                defaultValue={editingRoom?.number ?? ""}
                placeholder="Número"
                className={staffInput}
              />
              <input
                name="label"
                required
                defaultValue={editingRoom?.label ?? ""}
                placeholder="Etiqueta"
                className={staffInput}
              />
              <select
                name="floorId"
                required
                defaultValue={editingRoom?.floorId ?? ""}
                className={staffInput}
              >
                <option value="">Piso</option>
                {activeFloors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.label}
                  </option>
                ))}
              </select>
              <select
                name="sectorId"
                required
                defaultValue={editingRoom?.sectorId ?? ""}
                className={staffInput}
              >
                <option value="">Sector</option>
                {activeSectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.label}
                  </option>
                ))}
              </select>
              {editingRoom && (
                <>
                  <p className="text-sm text-[#7a9ab5] sm:col-span-2">
                    roomKey: <code className="rounded bg-white/10 px-1 text-[#5ee9b5]">{editingRoom.roomKey}</code>
                  </p>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input name="active" type="checkbox" defaultChecked={editingRoom.active} />
                    Activa
                  </label>
                </>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className={staffBtnPrimary}>
                {editingRoom ? "Guardar" : "Crear habitación"}
              </button>
              {editingRoom && (
                <button type="button" onClick={() => setEditingRoomId(null)} className={staffBtnSecondary}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <ul className="space-y-2">
            {rooms.map((room) => (
              <li key={room.id} className={staffCard}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#f0f4f8]">{room.label}</p>
                    <p className="text-sm text-[#7a9ab5]">
                      Piso {room.floor} · Sector {room.sector}
                      {!room.active && " · Inactiva"}
                    </p>
                    <p className="text-xs text-[#7a9ab5]/70">
                      key: {room.roomKey} ·{" "}
                      <Link
                        href={`/habitacion?key=${encodeURIComponent(room.roomKey)}`}
                        className="text-[#5ee9b5] hover:underline"
                        target="_blank"
                      >
                        Abrir tablet
                      </Link>
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditingRoomId(room.id)} className="text-sm text-[#5ee9b5]">
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
