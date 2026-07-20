import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signFamilyJoinToken } from "@/lib/auth";
import { acceptFamilyCall } from "@/lib/calls-service";
import { serializeCall } from "@/lib/calls";
import { consumeFamilyJoinToken } from "@/lib/family-invite";
import type { Call } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = (body.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
    }

    const consumed = await consumeFamilyJoinToken(token);
    if (!consumed.ok) {
      const msg =
        consumed.reason === "expired"
          ? "El enlace expiró. Solicite una nueva invitación."
          : consumed.reason === "used"
            ? "Este enlace ya fue utilizado."
            : "Enlace inválido.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const db = await getDb();
    const call = await db.collection<Call>("calls").findOne({
      _id: consumed.callId,
    });

    if (
      !call ||
      call.targetRole !== "family" ||
      call.type !== "video" ||
      (call.status !== "pending" && call.status !== "accepted")
    ) {
      return NextResponse.json(
        { error: "La videollamada ya no está disponible." },
        { status: 409 },
      );
    }

    if (!call.roomId.equals(consumed.roomId)) {
      return NextResponse.json({ error: "Enlace inválido." }, { status: 400 });
    }

    let activeCall: Call = call;
    if (call.status === "pending") {
      const accepted = await acceptFamilyCall(call._id!);
      if (accepted.ok) {
        activeCall = accepted.call;
      } else if (accepted.reason === "already_accepted") {
        const fresh = await db
          .collection<Call>("calls")
          .findOne({ _id: call._id });
        if (!fresh || fresh.status !== "accepted") {
          return NextResponse.json(
            { error: "La videollamada ya no está disponible." },
            { status: 409 },
          );
        }
        activeCall = fresh;
      } else {
        return NextResponse.json(
          { error: "No se pudo unir a la videollamada." },
          { status: 409 },
        );
      }
    }

    const jwt = signFamilyJoinToken(activeCall._id!.toString());

    return NextResponse.json({
      token: jwt,
      callId: activeCall._id!.toString(),
      call: serializeCall(activeCall),
      roomId: activeCall.roomId.toString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Error al unirse a la videollamada" },
      { status: 500 },
    );
  }
}
