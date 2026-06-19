export function resolveRoomKey(
  queryKey: string | null | undefined,
  bodyKey: string | null | undefined,
  envKey: string | undefined,
): string {
  const fromQuery = queryKey?.trim() ?? "";
  const fromBody = bodyKey?.trim() ?? "";
  const fromEnv = envKey?.trim() ?? "";
  return fromQuery || fromBody || fromEnv;
}
