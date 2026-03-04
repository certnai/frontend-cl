"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import Link from "next/link";
import {
  PREDICTION_NFT_ADDRESS,
  NFT_MARKETPLACE_ADDRESS,
} from "@/lib/contracts";
import { predictionNFTAbi, nftMarketplaceAbi } from "@/lib/abis";

/* ───────── single prediction card ───────── */
function PredictionCard({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount();
  const [listPrice, setListPrice] = useState("");
  const [listStep, setListStep] = useState<"idle" | "approving" | "approved" | "listing" | "cancelling">("idle");

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

  const { data: isListedData, refetch: refetchListed } = useReadContract({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: nftMarketplaceAbi,
    functionName: "isListed",
    args: [PREDICTION_NFT_ADDRESS, tokenId],
  });

  const { data: listingData, refetch: refetchListing } = useReadContract({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: nftMarketplaceAbi,
    functionName: "getListingByToken",
    args: [PREDICTION_NFT_ADDRESS, tokenId],
    query: { enabled: !!isListedData },
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onReplaced: () => {
      refetchListed();
      refetchListing();
    },
  });

  // Refetch listing state after tx success
  if (isSuccess && listStep === "approving") {
    setListStep("approved");
  }
  if (isSuccess && (listStep === "listing" || listStep === "cancelling")) {
    refetchListed();
    refetchListing();
    setListStep("idle");
  }

  const pred = predData as
    | {
        predictor: string;
        predictionText: string;
        sport: string;
        gameInfo: string;
        accuracyScore: bigint;
        isScored: boolean;
        stakeAmount: bigint;
        gameId: `0x${string}`;
        isRedeemed: boolean;
      }
    | undefined;

  const redeem = redeemable as [boolean, string, bigint] | undefined;
  const canRedeem = redeem?.[0] ?? false;
  const redeemReason = redeem?.[1] ?? "";
  const rewardAmount = redeem?.[2] ?? BigInt(0);
  const isListed = !!isListedData;
  const listing = listingData as { listingId: bigint; price: bigint; seller: string } | undefined;

  function handleRedeem() {
    writeContract({
      address: PREDICTION_NFT_ADDRESS,
      abi: predictionNFTAbi,
      functionName: "redeemNFT",
      args: [tokenId],
    });
  }

  function handleApprove() {
    setListStep("approving");
    writeContract({
      address: PREDICTION_NFT_ADDRESS,
      abi: predictionNFTAbi,
      functionName: "approve",
      args: [NFT_MARKETPLACE_ADDRESS, tokenId],
    });
  }

  function handleList() {
    if (!listPrice) return;
    setListStep("listing");
    writeContract({
      address: NFT_MARKETPLACE_ADDRESS,
      abi: nftMarketplaceAbi,
      functionName: "listNFT",
      args: [PREDICTION_NFT_ADDRESS, tokenId, parseEther(listPrice)],
    });
  }

  function handleCancel() {
    if (!listing?.listingId) return;
    setListStep("cancelling");
    writeContract({
      address: NFT_MARKETPLACE_ADDRESS,
      abi: nftMarketplaceAbi,
      functionName: "cancelListing",
      args: [listing.listingId],
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
          {pred?.isRedeemed ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
              Redeemed
            </span>
          ) : pred?.isScored ? (
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
      {pred?.isScored && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Number(pred.accuracyScore)}%`,
                  backgroundColor:
                    Number(pred.accuracyScore) >= 70
                      ? "#22c55e"
                      : Number(pred.accuracyScore) >= 40
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
                Number(pred.accuracyScore) >= 70
                  ? "#22c55e"
                  : Number(pred.accuracyScore) >= 40
                    ? "#eab308"
                    : "#ef4444",
            }}
          >
            {pred.accuracyScore.toString()}/100
          </span>
        </div>
      )}

      {/* Redeem Button */}
      {pred?.isScored && !pred?.isRedeemed && (
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

      {/* Marketplace — List / Cancel */}
      {pred && !pred.isRedeemed && (
        <div className="pt-2 border-t border-white/10">
          {isListed && listing ? (
            /* Already listed — show price + cancel button */
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">
                Listed:{" "}
                <span className="text-yellow-400 font-medium">
                  {formatEther(listing.price)} ETH
                </span>
              </span>
              <button
                onClick={handleCancel}
                disabled={isPending || isConfirming}
                className="text-sm px-4 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
              >
                {isPending || isConfirming ? "Cancelling..." : "Cancel Listing"}
              </button>
            </div>
          ) : (
            /* Not listed — offer list-for-sale UI */
            (
              <div className="space-y-2">
                <p className="text-xs text-[var(--muted)]">Sell on marketplace</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="Price in ETH"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-indigo-500"
                  />
                  {listStep === "idle" && (
                    <button
                      onClick={handleApprove}
                      disabled={!listPrice || isPending || isConfirming}
                      className="text-sm px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-40 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {listStep === "approving" && (
                    <button
                      disabled
                      className="text-sm px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 opacity-40 transition-colors"
                    >
                      {isPending || isConfirming ? "Approving..." : "Approve"}
                    </button>
                  )}
                  {(listStep === "approved" || listStep === "listing") && (
                    <button
                      onClick={handleList}
                      disabled={!listPrice || isPending || isConfirming}
                      className="text-sm px-4 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-40 transition-colors"
                    >
                      {isPending || isConfirming ? "Listing..." : "List NFT"}
                    </button>
                  )}
                </div>
              </div>
            )
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
