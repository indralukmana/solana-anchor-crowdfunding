import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet, type WalletContextState } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import {
  CrowdfundingIdl,
  getProfilePda,
  getCampaignPda,
  getVaultPda,
  getContributionPda,
  PROGRAM_ID,
} from "@crowdfunding/sdk";
import type { Crowdfunding } from "@crowdfunding/sdk";
import { toast } from "sonner";

function buildProgram(connection: Connection, wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program<Crowdfunding>(CrowdfundingIdl as Crowdfunding, provider);
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (metadataUri: string) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [profilePda] = getProfilePda(wallet.publicKey, PROGRAM_ID);

      const tx = await program.methods
        .createProfile(metadataUri)
        .accountsPartial({
          profile: profilePda,
          creator: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (metadataUri: string) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [profilePda] = getProfilePda(wallet.publicKey, PROGRAM_ID);

      const tx = await program.methods
        .updateProfile(metadataUri)
        .accountsPartial({
          profile: profilePda,
          creator: wallet.publicKey,
        })
        .rpc();

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (input: { goal: number; deadline: number }) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [profilePda] = getProfilePda(wallet.publicKey, PROGRAM_ID);
      const profile = await program.account.creatorProfile.fetch(profilePda);

      const [campaignPda] = getCampaignPda(
        wallet.publicKey,
        profile.campaignCount,
        PROGRAM_ID,
      );
      const [vaultPda] = getVaultPda(campaignPda, PROGRAM_ID);

      const tx = await program.methods
        .createCampaign(new BN(input.goal), new BN(input.deadline))
        .accountsPartial({
          profile: profilePda,
          campaign: campaignPda,
          vault: vaultPda,
          creator: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}

export function useContribute() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (input: {
      campaignPda: web3.PublicKey;
      amount: number;
    }) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [contributionPda] = getContributionPda(
        input.campaignPda,
        wallet.publicKey,
        PROGRAM_ID,
      );
      const [vaultPda] = getVaultPda(input.campaignPda, PROGRAM_ID);

      const tx = await program.methods
        .contribute(new BN(input.amount))
        .accountsPartial({
          campaign: input.campaignPda,
          contribution: contributionPda,
          vault: vaultPda,
          donor: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    onSuccess: (_tx, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["campaign", vars.campaignPda.toBase58()],
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["contribution"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}

export function useInitializeContribution() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (campaignPda: web3.PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [contributionPda] = getContributionPda(
        campaignPda,
        wallet.publicKey,
        PROGRAM_ID,
      );

      const tx = await program.methods
        .initializeContribution()
        .accountsPartial({
          campaign: campaignPda,
          contribution: contributionPda,
          donor: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    onSuccess: (_tx, campaignPda) => {
      queryClient.invalidateQueries({
        queryKey: ["contribution", campaignPda.toBase58()],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (campaignPda: web3.PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [vaultPda] = getVaultPda(campaignPda, PROGRAM_ID);

      const tx = await program.methods
        .withdraw()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          creator: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    onSuccess: (_tx, campaignPda) => {
      queryClient.invalidateQueries({
        queryKey: ["campaign", campaignPda.toBase58()],
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}

export function useRefund() {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async (campaignPda: web3.PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = buildProgram(connection, wallet);

      const [vaultPda] = getVaultPda(campaignPda, PROGRAM_ID);
      const [contributionPda] = getContributionPda(
        campaignPda,
        wallet.publicKey,
        PROGRAM_ID,
      );

      const tx = await program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          contribution: contributionPda,
          donor: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    onSuccess: (_tx, campaignPda) => {
      queryClient.invalidateQueries({
        queryKey: ["campaign", campaignPda.toBase58()],
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["contribution"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    },
  });
}
