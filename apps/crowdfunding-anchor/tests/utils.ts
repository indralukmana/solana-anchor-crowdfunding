import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "@crowdfunding/sdk";
import { PublicKey } from "@solana/web3.js";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";

// Initialize base SVM once
const baseSvm = fromWorkspace("./").withDefaultPrograms().withBuiltins().withSysvars();

export const setupTest = () => {
  const svm = baseSvm;
  const provider = new LiteSVMProvider(svm);

  const svmGetBalance = (publicKey: PublicKey): number => {
    return Number(svm.getBalance(publicKey) ?? BigInt(0));
  };

  const svmGetTransaction = (txSig: string) => {
    const meta = svm.getTransaction(anchor.utils.bytes.bs58.decode(txSig));
    if (!meta) return null;
    const logs = "logs" in meta ? (meta as any).logs() : (meta as any).meta().logs();
    return {
      meta: {
        logMessages: logs,
        err: "err" in meta ? (meta as any).err() : null,
      },
    };
  };

  // Internal monkey-patching strictly for parseEvents SDK compatibility
  (provider.connection as any).getBalance = async (pk: PublicKey) => svmGetBalance(pk);
  (provider.connection as any).getTransaction = async (sig: string) => svmGetTransaction(sig);

  anchor.setProvider(provider);

  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

  const svmAirdrop = (addresses: PublicKey[]) => {
    for (const address of addresses) {
      const res = svm.airdrop(address, BigInt(10 * 1_000_000_000));
      if (res && "err" in res && res.err()) {
        throw new Error(`Airdrop failed for ${address.toBase58()}: ${res.err()}`);
      }
    }
  };

  const warp = (seconds: number) => {
    const clock = svm.getClock();
    clock.slot += BigInt(Math.ceil(seconds / 0.4));
    clock.unixTimestamp += BigInt(seconds);
    svm.setClock(clock);
  };

  return {
    svm,
    provider,
    program,
    svmAirdrop,
    warp,
    svmGetBalance,
    svmGetTransaction,
  };
};
