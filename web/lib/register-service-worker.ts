let registered = false;

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (registered) return;
  registered = true;

  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
    registered = false;
  });
}
