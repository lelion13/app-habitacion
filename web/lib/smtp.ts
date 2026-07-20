import nodemailer from "nodemailer";

export type SmtpSendResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "send_failed" };

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_FROM?.trim(),
  );
}

function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;

  if (!host || !Number.isFinite(port)) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass != null ? { user, pass } : undefined,
  });
}

export async function sendFamilyInviteEmail(params: {
  to: string;
  roomLabel: string;
  joinUrl: string;
  message?: string;
}): Promise<SmtpSendResult> {
  if (!isSmtpConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const transport = createTransport();
  const from = process.env.SMTP_FROM?.trim();
  if (!transport || !from) {
    return { ok: false, reason: "not_configured" };
  }

  const optionalMsg = params.message?.trim()
    ? `\n\nMensaje de la habitación:\n${params.message.trim()}\n`
    : "";

  const text = [
    `Lo invitaron a una videollamada desde ${params.roomLabel}.`,
    optionalMsg,
    `Abra este enlace (válido 3 horas, un solo uso):`,
    params.joinUrl,
    ``,
    `Si no solicitó esta llamada, ignore este correo.`,
  ].join("\n");

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: `Videollamada — ${params.roomLabel}`,
      text,
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "send_failed" };
  }
}
