import type BN from "bn.js";

export function formatSol(lamports: BN | bigint | number): string {
  const val =
    typeof lamports === "bigint"
      ? Number(lamports)
      : (lamports as BN).toNumber?.()
        ? (lamports as BN).toNumber()
        : Number(lamports);
  return (val / 1e9).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatDate(ts: number | BN | bigint): string {
  const n =
    typeof ts === "bigint"
      ? Number(ts)
      : (ts as BN).toNumber?.()
        ? (ts as BN).toNumber()
        : Number(ts);
  return new Date(n * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
