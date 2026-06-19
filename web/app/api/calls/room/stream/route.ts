import { NextRequest } from "next/server";
import { subscribeRoomChannel } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId") ?? "";

  if (!roomId) {
    return new Response(JSON.stringify({ error: "roomId requerido" }), {
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

      unsubscribe = subscribeRoomChannel(roomId, { send, close });
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
