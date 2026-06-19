import { NextRequest } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { validateListenConfig } from "@/lib/validation";
import { subscribeListenChannel } from "@/lib/sse";
import type { StaffRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token =
    getBearerToken(request.headers.get("authorization")) ??
    request.nextUrl.searchParams.get("token");

  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const floor = request.nextUrl.searchParams.get("floor") ?? "";
  const sector = request.nextUrl.searchParams.get("sector") ?? "";
  const role = request.nextUrl.searchParams.get("role") ?? "";

  if (!validateListenConfig({ floor, sector, role: role as StaffRole })) {
    return new Response(JSON.stringify({ error: "Parámetros inválidos" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(data));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      unsubscribe = subscribeListenChannel(
        { floor, sector, role: role as StaffRole },
        { send, close },
      );

      send(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      closed = true;
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
