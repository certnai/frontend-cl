"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import Link from "next/link";
import { PREDICTION_NFT_ADDRESS, NFT_MARKETPLACE_ADDRESS } from "@/lib/contracts";
import { predictionNFTAbi, nftMarketplaceAbi } from "@/lib/abis";

type Listing = {
  listingId: bigint;
  nftContract: `0x${string}`;
  tokenId: bigint;
  seller: `0x${string}`;
  price: bigint;
  active: boolean;
  listedAt: bigint;
};

/* ───────── single listing card ───────── */
function ListingCard({ listing }: { listing: Listing }) {
  const { address } = useAccount();

  const { data: predData } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getPrediction",
    args: [listing.tokenId],
    query: { enabled: listing.nftContract.toLowerCase() === PREDICTION_NFT_ADDRESS.toLowerCase() },
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const pred = predData as
    | {
        predictionText: string;
        sport: string;
        gameInfo: string;
        accuracyScore: bigint;
        isScored: boolean;
        stakeAmount: bigint;
        predictor: string;
        isRedeemed: boolean;
      }
    | undefined;

  const espnGameId = pred?.gameInfo ? pred.gameInfo.match(/\d+/)?.[0] ?? null : null;
  const isSeller = address?.toLowerCase() === listing.seller.toLowerCase();

  function handleBuy() {
    writeContract({
      address: NFT_MARKETPLACE_ADDRESS,
      abi: nftMarketplaceAbi,
      functionName: "buyNFT",
      args: [listing.listingId],
      value: listing.price,
    });
  }

  return (
    <div className="card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-indigo-400 font-bold">
            #{listing.tokenId.toString()}
          </span>
          {pred?.sport && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--muted)]">
              {pred.sport}
            </span>
          )}
          {pred?.isScored && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Scored · {pred.accuracyScore.toString()}/100
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-yellow-400">
          {formatEther(listing.price)} ETH
        </span>
      </div>

      {/* Prediction Text */}
      <p className="text-sm text-white leading-relaxed">
        {pred?.predictionText ?? "Loading..."}
      </p>

      {/* Info Row */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
        {espnGameId && (
          <Link href={`/game/${espnGameId}`} className="text-indigo-400 hover:underline">
            Game #{espnGameId}
          </Link>
        )}
        <span>
          Original stake: {pred?.stakeAmount ? formatEther(pred.stakeAmount) : "—"} ETH
        </span>
        <span className="font-mono">
          Seller: {listing.seller.slice(0, 6)}…{listing.seller.slice(-4)}
        </span>
      </div>

      {/* Buy Button */}
      {!isSeller && !isSuccess && (
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">
              2.5% marketplace fee applies
            </p>
            <button
              onClick={handleBuy}
              disabled={isPending || isConfirming}
              className="btn-primary text-sm px-4 py-1.5 disabled:opacity-40"
            >
              {isPending ? "Confirm..." : isConfirming ? "Buying..." : `Buy · ${formatEther(listing.price)} ETH`}
            </button>
          </div>
        </div>
      )}

      {isSeller && (
        <p className="text-xs text-[var(--muted)] pt-1">
          This is your listing — manage it in{" "}
          <Link href="/predictions" className="text-indigo-400 hover:underline">
            My Predictions
          </Link>
        </p>
      )}

      {isSuccess && hash && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs space-y-1">
          <p className="text-green-400 font-medium">Purchase successful! NFT is now in your wallet.</p>
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
  );
}

/* ───────── main page ───────── */
export default function MarketplacePage() {
  const { isConnected } = useAccount();

  const { data: listingsData, isLoading } = useReadContract({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: nftMarketplaceAbi,
    functionName: "getActiveListings",
  });

  const listings = (listingsData as Listing[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Buy and sell prediction NFTs · 2.5% fee
          </p>
        </div>
        {!isConnected && <ConnectButton />}
      </div>

      {isLoading ? (
        <div className="card p-12 text-center">
          <p className="text-[var(--muted)]">Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <p className="text-[var(--muted)]">No active listings yet.</p>
          <p className="text-xs text-[var(--muted)]">
            List your prediction NFTs from{" "}
            <Link href="/predictions" className="text-indigo-400 hover:underline">
              My Predictions
            </Link>{" "}
            after scoring.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.listingId.toString()} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
