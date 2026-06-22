export interface RoomManifestInput {
  roomKey: string;
  label: string;
  number: string;
}

export function manifestShortName(label: string, number: string): string {
  if (label.length <= 12) return label;
  const short = `Hab. ${number}`;
  return short.length <= 12 ? short : short.slice(0, 12);
}

export function buildRoomManifest({ roomKey, label, number }: RoomManifestInput) {
  const startUrl = `/habitacion?key=${encodeURIComponent(roomKey)}`;

  return {
    id: startUrl,
    name: label,
    short_name: manifestShortName(label, number),
    description: `Llamados hospitalarios — ${label}`,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0d9488",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
