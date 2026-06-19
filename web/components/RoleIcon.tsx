import type { StaffRole } from "@/lib/types";

const ROLE_COLORS: Record<StaffRole, string> = {
  nurse: "bg-teal-500",
  quality: "bg-amber-500",
  doctor: "bg-indigo-500",
};

const ROLE_ICONS: Record<StaffRole, string> = {
  nurse: "✚",
  quality: "◎",
  doctor: "⚕",
};

interface RoleIconProps {
  role: StaffRole;
  size?: "sm" | "lg";
}

export function RoleIcon({ role, size = "sm" }: RoleIconProps) {
  const dim = size === "lg" ? "h-14 w-14 text-2xl" : "h-10 w-10 text-lg";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl text-white font-bold ${ROLE_COLORS[role]} ${dim}`}
      aria-hidden
    >
      {ROLE_ICONS[role]}
    </span>
  );
}

interface CallTypeIconProps {
  type: "bell" | "video";
}

export function CallTypeIcon({ type }: CallTypeIconProps) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-white ${
        type === "bell" ? "bg-orange-500" : "bg-violet-600"
      }`}
      aria-hidden
    >
      {type === "bell" ? "🔔" : "📹"}
    </span>
  );
}
