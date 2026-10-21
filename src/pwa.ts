import { BASE, asset } from "./platform";
export async function registerUpdates(onReady: (activate: () => void) => void) {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  let registration = await navigator.serviceWorker.register(
    asset("sw.js") + "?v=" + encodeURIComponent(import.meta.env.VITE_APP_BUILD_ID),
    { scope: BASE, updateViaCache: "none" },
  );
  const observed = new WeakSet<ServiceWorkerRegistration>();
  const observe = (reg: ServiceWorkerRegistration) => {
    const ready = () => {
      if (reg.waiting)
        onReady(() => reg.waiting?.postMessage({ type: "SKIP_WAITING" }));
    };
    ready();
    if (observed.has(reg)) return;
    observed.add(reg);
    const installing = () => {
      const worker = reg.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller)
          ready();
      });
    };
    installing();
    reg.addEventListener("updatefound", installing);
  };
  observe(registration);
  let controlled = !!navigator.serviceWorker.controller,
    reloading = false,
    checking = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!controlled) {
      controlled = true;
      return;
    }
    if (!reloading) {
      reloading = true;
      window.dispatchEvent(new Event("app-update-activated"));
    }
  });
  const check = async () => {
    if (checking || document.visibilityState !== "visible" || !navigator.onLine)
      return;
    checking = true;
    try {
      // Revalidate even on hosts without configurable cache headers.
      const response = await fetch(
        asset("version.json") + "?check=" + Date.now(),
        { cache: "no-store" },
      );
      if (response.ok) {
        const manifest = await response.json();
        if (
          typeof manifest.version === "string" &&
          manifest.version !== import.meta.env.VITE_APP_BUILD_ID
        ) {
          registration = await navigator.serviceWorker.register(
            asset("sw.js") + "?v=" + encodeURIComponent(manifest.version),
            { scope: BASE, updateViaCache: "none" },
          );
          observe(registration);
        } else await registration.update();
      } else await registration.update();
    } catch {
      /* Offline access remains available. */
    } finally {
      checking = false;
    }
  };
  document.addEventListener("visibilitychange", check);
  window.addEventListener("online", check);
  window.addEventListener("focus", check);
  setInterval(check, 60000);
  void check();
}
