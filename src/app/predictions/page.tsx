"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import Link from "next/link";
import {
  PREDICTION_NFT_ADDRESS,
  STAKING_REGISTRY_ADDRESS,
} from "@/lib/contracts";
import { predictionNFTAbi, stakingRegistryAbi } from "@/lib/abis";

/* ───────── single prediction card ───────── */
function PredictionCard({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount();

  const { data: predData } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getPrediction",
    args: [tokenId],
  });

  const { data: redeemable } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "isNFTRedeemable",
    args: [tokenId],
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const pred = predData as
    | {
        predictor: string;
        predictionText: string;
        sport: string;
        gameInfo: string;
        score: bigint;
        resolved: boolean;
        stakeAmount: bigint;
        gameId: `0x${string}`;
        redeemed: boolean;
      }
    | undefined;

  const redeem = redeemable as [boolean, string, bigint] | undefined;
  const canRedeem = redeem?.[0] ?? false;
  const redeemReason = redeem?.[1] ?? "";
  const rewardAmount = redeem?.[2] ?? BigInt(0);

  function handleRedeem() {
    writeContract({
      address: PREDICTION_NFT_ADDRESS,
      abi: predictionNFTAbi,
      functionName: "redeemNFT",
      args: [tokenId],
    });
  }

  // Derive ESPN game ID from gameInfo (gameId bytes32 is now keccak256, not reversible)
  const espnGameId = pred?.gameInfo ? pred.gameInfo.match(/\d+/)?.[0] ?? null : null;

  return (
    <div className="card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-indigo-400 font-bold">
            #{tokenId.toString()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--muted)]">
            {pred?.sport ?? "..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {pred?.redeemed ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
              Redeemed
            </span>
          ) : pred?.resolved ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Scored
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Prediction Text */}
      <p className="text-sm text-white leading-relaxed">
        {pred?.predictionText ?? "Loading..."}
      </p>

      {/* Info Row */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
        {espnGameId && espnGameId !== "0" && (
          <Link
            href={`/game/${espnGameId}`}
            className="text-indigo-400 hover:underline"
          >
            Game #{espnGameId}
          </Link>
        )}
        <span>
          Staked: {pred?.stakeAmount ? formatEther(pred.stakeAmount) : "—"} ETH
        </span>
        {pred?.gameInfo && <span>{pred.gameInfo}</span>}
      </div>

      {/* Score Display */}
      {pred?.resolved && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Number(pred.score)}%`,
                  backgroundColor:
                    Number(pred.score) >= 70
                      ? "#22c55e"
                      : Number(pred.score) >= 40
                        ? "#eab308"
                        : "#ef4444",
                }}
              />
            </div>
          </div>
          <span
            className="text-lg font-bold"
            style={{
              color:
                Number(pred.score) >= 70
                  ? "#22c55e"
                  : Number(pred.score) >= 40
                    ? "#eab308"
                    : "#ef4444",
            }}
          >
            {pred.score.toString()}/100
          </span>
        </div>
      )}

      {/* Redeem Button */}
      {pred?.resolved && !pred?.redeemed && (
        <div className="pt-2 border-t border-white/10">
          {canRedeem ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">
                Reward:{" "}
                <span className="text-green-400 font-medium">
                  {formatEther(rewardAmount)} ETH
                </span>
              </span>
              <button
                onClick={handleRedeem}
                disabled={isPending || isConfirming}
                className="btn-primary text-sm px-4 py-1.5 disabled:opacity-40"
              >
                {isPending
                  ? "Confirm..."
                  : isConfirming
                    ? "Redeeming..."
                    : "Redeem NFT"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)]">{redeemReason}</p>
          )}
          {isSuccess && hash && (
            <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
              <p className="text-green-400">Redeemed!</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                View on Etherscan →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── main page ───────── */
export default function PredictionsPage() {
  const { address, isConnected } = useAccount();

  const { data: userTokens, isLoading } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getUserPredictions",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const tokens = ((userTokens as bigint[]) ?? []).slice().reverse();

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Predictions</h1>
        <div className="card p-12 text-center space-y-4">
          <p className="text-[var(--muted)]">
            Connect your wallet to view your predictions
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Predictions</h1>
        <span className="text-sm text-[var(--muted)]">
          {tokens.length} total
        </span>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center">
          <p className="text-[var(--muted)]">Loading predictions...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <p className="text-[var(--muted)]">
            You haven&apos;t made any predictions yet.
          </p>
          <Link href="/" className="btn-primary inline-block px-6">
            Browse Games
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tokens.map((tokenId) => (
            <PredictionCard key={tokenId.toString()} tokenId={tokenId} />
          ))}
        </div>
      )}
    </div>
  );
}
