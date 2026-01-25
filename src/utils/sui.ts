const MIST_PER_SUI = 1_000_000_000n;

export function mistToSui(mist: bigint, maxFractionDigits = 9): string {
  const sign = mist < 0n ? "-" : "";
  const abs = mist < 0n ? -mist : mist;
  const whole = abs / MIST_PER_SUI;
  const frac = abs % MIST_PER_SUI;

  if (maxFractionDigits <= 0) return `${sign}${whole.toString()}`;

  // Always pad to 9 digits, then trim.
  const fracStr = frac.toString().padStart(9, "0");
  const trimmed = fracStr.slice(0, Math.min(9, maxFractionDigits)).replace(/0+$/, "");
  return trimmed.length ? `${sign}${whole.toString()}.${trimmed}` : `${sign}${whole.toString()}`;
}

export function suiToMist(amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed) return 0n;

  const sign = trimmed.startsWith("-") ? -1n : 1n;
  const s = trimmed.replace(/^[-+]/, "");

  const [wholeRaw, fracRaw = ""] = s.split(".");
  const whole = BigInt(wholeRaw || "0");
  const fracPadded = (fracRaw + "000000000").slice(0, 9);
  const frac = BigInt(fracPadded || "0");
  return sign * (whole * MIST_PER_SUI + frac);
}

export function shortAddress(addr?: string, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= 2 + chars * 2) return addr;
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

export function isUserRejectedError(e: unknown): boolean {
  const msg = (e as any)?.message?.toString?.() ?? "";
  // Wallet implementations vary; keep this a loose match.
  return /rejected|reject|denied|user cancelled|user canceled/i.test(msg);
}
