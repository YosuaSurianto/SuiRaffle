// Network-independent fallback values.
// You can override these via Vercel / Vite env vars:
// - VITE_PACKAGE_ID
// - VITE_MODULE (optional, default: game)

export const DEFAULT_MODULE = import.meta.env.VITE_MODULE ?? "game";

export const DEFAULT_PACKAGE_ID =
  import.meta.env.VITE_PACKAGE_ID ??
  // ⛔️ Replace with your published package id (or set VITE_PACKAGE_ID)
  "0x1a5d0c5d5b4c9f75f032071ee7f29216b665b3bb9200eb254c5777982b2b6d8a";

export function poolCreatedEventType(packageId: string, moduleName = DEFAULT_MODULE) {
  return `${packageId}::${moduleName}::PoolCreated`;
}

export function winnerDrawnEventType(packageId: string, moduleName = DEFAULT_MODULE) {
  return `${packageId}::${moduleName}::WinnerDrawn`;
}
