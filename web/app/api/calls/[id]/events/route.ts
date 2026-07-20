import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getBearerToken,
  isFamilyJoinPayload,
  verifyToken,
} from "@/lib/auth";
import { subscribeCallChannel } from "@/lib/sse";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ error: "ID inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token =
    getBearerToken(request.headers.get("authorization")) ??
    request.nextUrl.searchParams.get("token");
  const payload = token ? verifyToken(token) : null;

  if (
    !payload ||
    !isFamilyJoinPayload(payload) ||
    payload.callId !== id
  ) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
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

      unsubscribe = subscribeCallChannel(id, { send, close });
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
