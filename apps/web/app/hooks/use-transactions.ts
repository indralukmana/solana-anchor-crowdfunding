import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import {
  CrowdfundingIdl,
  getProfilePda,
  getCampaignPda,
  getVaultPda,
  getContributionPda,
} from "@crowdfunding/sdk";
import { PROGRAM_ID } from "@/lib/crowdfunding/constants";
import type { Crowdfunding } from "@crowdfunding/sdk";
import type { CreatorProfile } from "@/lib/crowdfunding/types";

function useProgramWithWallet() {
  const { connection } = useConnection();
  const wallet = useWallet();

  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program(CrowdfundingIdl as Crowdfunding, provider);
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (metadataUri: string) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [profilePda] = getProfilePda(wallet.publicKey, PROGRAM_ID);

      const tx = await program.methods
        .createProfile(metadataUri)
        .accounts({
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
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (metadataUri: string) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [profilePda] = getProfilePda(wallet.publicKey, PROGRAM_ID);

      const tx = await program.methods
        .updateProfile(metadataUri)
        .accounts({
          profile: profilePda,
          creator: wallet.publicKey,
        })
        .rpc();

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (input: { goal: number; deadline: number }) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [profilePda] = getProfilePda(wallet.publicKey, PROGRAM_ID);
      const profile = (await (
        program.account as Record<string, { fetch: (addr: web3.PublicKey) => Promise<CreatorProfile> }>
      ).creatorProfile.fetch(profilePda));

      const [campaignPda] = getCampaignPda(
        wallet.publicKey,
        profile.campaignCount,
        PROGRAM_ID,
      );
      const [vaultPda] = getVaultPda(campaignPda, PROGRAM_ID);

      const tx = await program.methods
        .createCampaign(new BN(input.goal), new BN(input.deadline))
        .accounts({
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
  });
}

export function useContribute() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (input: {
      campaignPda: web3.PublicKey;
      amount: number;
    }) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [contributionPda] = getContributionPda(
        input.campaignPda,
        wallet.publicKey,
        PROGRAM_ID,
      );
      const [vaultPda] = getVaultPda(input.campaignPda, PROGRAM_ID);

      const tx = await program.methods
        .contribute(new BN(input.amount))
        .accounts({
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
  });
}

export function useInitializeContribution() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (campaignPda: web3.PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [contributionPda] = getContributionPda(
        campaignPda,
        wallet.publicKey,
        PROGRAM_ID,
      );

      const tx = await program.methods
        .initializeContribution()
        .accounts({
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
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (campaignPda: web3.PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [vaultPda] = getVaultPda(campaignPda, PROGRAM_ID);

      const tx = await program.methods
        .withdraw()
        .accounts({
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
  });
}

export function useRefund() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (campaignPda: web3.PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const program = useProgramWithWallet();

      const [vaultPda] = getVaultPda(campaignPda, PROGRAM_ID);
      const [contributionPda] = getContributionPda(
        campaignPda,
        wallet.publicKey,
        PROGRAM_ID,
      );

      const tx = await program.methods
        .refund()
        .accounts({
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
  });
}
