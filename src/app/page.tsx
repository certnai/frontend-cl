"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import Link from "next/link";
import {
  PREDICTION_NFT_ADDRESS,
  STAKING_REGISTRY_ADDRESS,
  SPORTS_PREDICTION_RESOLVER_ADDRESS,
} from "@/lib/contracts";
import {
  predictionNFTAbi,
  stakingRegistryAbi,
  sportsPredictionResolverAbi,
} from "@/lib/abis";
import { useEffect, useState } from "react";
import { getHealth, getUpcomingGames } from "@/lib/api";
import type { UpcomingGame } from "@/lib/api";

/* ───────────── tiny stat card ───────────── */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 p-6">
      <span className="text-3xl font-bold text-white">{value}</span>
      <span className="text-xs text-[var(--muted)] uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

const SPORT_EMOJI: Record<string, string> = {
  NBA: "🏀",
  NFL: "🏈",
  MLB: "⚾",
  NHL: "🏒",
};

/* ───────────── helpers ───────────── */
function statusLabel(st?: string): string {
  if (!st) return "Upcoming";
  const s = st.toUpperCase();
  if (s.includes("FINAL")) return "Final";
  if (s.includes("IN_PROGRESS") || s.includes("LIVE")) return "🔴 Live";
  if (s.includes("SCHEDULED") || s.includes("PRE")) return "Upcoming";
  if (s.includes("POSTPONED")) return "Postponed";
  if (s.includes("HALFTIME")) return "Halftime";
  if (s.includes("DELAYED")) return "Delayed";
  return "Upcoming";
}

function statusColor(st?: string): string {
  if (!st) return "bg-blue-500/20 text-blue-400";
  const s = st.toUpperCase();
  if (s.includes("FINAL")) return "bg-green-500/20 text-green-400";
  if (s.includes("IN_PROGRESS") || s.includes("LIVE") || s.includes("HALFTIME"))
    return "bg-yellow-500/20 text-yellow-400";
  if (s.includes("POSTPONED") || s.includes("DELAYED"))
    return "bg-red-500/20 text-red-400";
  return "bg-blue-500/20 text-blue-400";
}

function formatGameDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* ───────────── single game card ───────────── */
function GameCard({ game }: { game: UpcomingGame }) {
  const s = (game.status ?? "").toUpperCase();
  const isFinal = s.includes("FINAL");
  const isLive = s.includes("IN_PROGRESS") || s.includes("LIVE");
  const hasScores = game.home_score != null && game.away_score != null;

  return (
    <Link
      href={`/game/${game.game_id}`}
      className="card p-5 hover:border-indigo-500/40 transition-all group flex flex-col gap-3"
    >
      {/* Top row: status + date */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(game.status)}`}>
          {statusLabel(game.status)}
        </span>
        <span className="text-[10px] text-[var(--muted)]">
          {formatGameDate(game.date)}
        </span>
      </div>

      {/* Matchup with optional scores */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
            {game.home_team}
          </p>
          <p className="text-[10px] text-[var(--muted)]">HOME</p>
        </div>

        <div className="flex flex-col items-center min-w-[60px]">
          {hasScores ? (
            <span className="text-lg font-black text-white">
              {game.home_score} - {game.away_score}
            </span>
          ) : (
            <span className="text-lg font-black text-[var(--muted)] opacity-40">
              VS
            </span>
          )}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-white group-hover:text-purple-300 transition truncate">
            {game.away_team}
          </p>
          <p className="text-[10px] text-[var(--muted)]">AWAY</p>
        </div>
      </div>

      {/* Venue */}
      {game.venue && (
        <p className="text-[10px] text-[var(--muted)] text-center truncate">
          📍 {game.venue}
        </p>
      )}

      {/* CTA */}
      <div className="text-center">
        <span className="text-xs text-indigo-400 group-hover:text-indigo-300 transition">
          {isFinal ? "View & Predict →" : isLive ? "Predict Live →" : "Predict Now →"}
        </span>
      </div>
    </Link>
  );
}

/* ───────────── games section by sport ───────────── */
function GamesSection() {
  const [activeSport, setActiveSport] = useState("NBA");
  const [liveGames, setLiveGames] = useState<Record<string, UpcomingGame[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      try {
        const [nba, nfl, mlb] = await Promise.allSettled([
          getUpcomingGames("nba", 3),
          getUpcomingGames("nfl", 7),
          getUpcomingGames("mlb", 3),
        ]);

        const fetched: Record<string, UpcomingGame[]> = {};
        if (nba.status === "fulfilled" && nba.value.length > 0)
          fetched.NBA = nba.value;
        if (nfl.status === "fulfilled" && nfl.value.length > 0)
          fetched.NFL = nfl.value;
        if (mlb.status === "fulfilled" && mlb.value.length > 0)
          fetched.MLB = mlb.value;

        setLiveGames(fetched);
      } catch {
        // fall back to samples
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  const SPORTS = ["NBA", "NFL", "MLB"];
  const games = liveGames[activeSport] ?? [];
  const isLiveData = games.length > 0;

  return (
    <div className="space-y-4">
      {/* Sport tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-semibold mr-2">Games</h2>
        {SPORTS.map((sport) => {
          const count = liveGames[sport]?.length;
          return (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                activeSport === sport
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                  : "bg-white/5 text-[var(--muted)] border border-white/10 hover:border-white/20"
              }`}
            >
              {SPORT_EMOJI[sport] || ""} {sport}
              {count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Source indicator */}
      {loading ? (
        <p className="text-[10px] text-[var(--muted)]">○ Fetching games from ESPN...</p>
      ) : isLiveData ? (
        <p className="text-[10px] text-green-400">● Live from ESPN via middleware — {games.length} games</p>
      ) : (
        <p className="text-[10px] text-[var(--muted)]">○ No games available — make sure the middleware is running</p>
      )}

      {/* Game cards grid — 3 per row */}
      {!loading && !isLiveData ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          <p className="text-4xl mb-3">🏟️</p>
          <p className="text-sm font-medium">No {activeSport} games found</p>
          <p className="text-xs mt-1">Start the middleware to load live ESPN data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.slice(0, 12).map((game) => (
            <GameCard key={game.game_id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── recent user predictions ───────────── */
function RecentPredictions() {
  const { address } = useAccount();

  const { data: userTokens } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getUserPredictions",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const tokens = (userTokens as bigint[]) ?? [];

  if (!address) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)] text-sm mb-4">
          Connect your wallet to see your predictions
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)] text-sm">
          No predictions yet. Pick a game above to make your first prediction!
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Predictions</h2>
        <Link
          href="/predictions"
          className="text-xs text-indigo-400 hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {tokens
          .slice(-5)
          .reverse()
          .map((tokenId) => (
            <TokenRow key={tokenId.toString()} tokenId={tokenId} />
          ))}
      </div>
    </div>
  );
}

function TokenRow({ tokenId }: { tokenId: bigint }) {
  const { data } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getPrediction",
    args: [tokenId],
  });

  const pred = data as
    | {
        predictionText: string;
        sport: string;
        gameInfo: string;
        score: bigint;
        resolved: boolean;
      }
    | undefined;

  return (
    <Link
      href="/predictions"
      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[var(--muted)]">
          #{tokenId.toString()}
        </span>
        <span className="text-sm text-white truncate max-w-[200px]">
          {pred?.predictionText ?? "Loading..."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {pred?.resolved ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            Score: {pred.score.toString()}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
            Pending
          </span>
        )}
      </div>
    </Link>
  );
}

/* ───────────── main page ───────────── */
export default function Home() {
  const [mwStatus, setMwStatus] = useState<"loading" | "up" | "down">(
    "loading",
  );

  const { data: totalSupply } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "totalSupply",
  });

  const { data: totalStaked } = useReadContract({
    address: STAKING_REGISTRY_ADDRESS,
    abi: stakingRegistryAbi,
    functionName: "totalStaked",
  });

  const { data: allResolutions } = useReadContract({
    address: SPORTS_PREDICTION_RESOLVER_ADDRESS,
    abi: sportsPredictionResolverAbi,
    functionName: "getAllGameResolutions",
  });

  useEffect(() => {
    getHealth()
      .then(() => setMwStatus("up"))
      .catch(() => setMwStatus("down"));
  }, []);

  const resolutionCount = (allResolutions as unknown[])?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Sports Predictions
          </span>
        </h1>
        <p className="text-[var(--muted)] max-w-xl mx-auto">
          Predict game outcomes, mint as NFTs, get scored by AI, and earn
          rewards — all settled on-chain via{" "}
          <span className="text-indigo-400 font-medium">Chainlink CRE</span>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Predictions Minted"
          value={totalSupply ? totalSupply.toString() : "—"}
        />
        <Stat
          label="Total Staked"
          value={
            totalStaked
              ? `${parseFloat(formatEther(totalStaked as bigint)).toFixed(4)} ETH`
              : "—"
          }
        />
        <Stat label="Games Resolved" value={resolutionCount.toString()} />
        <Stat
          label="Middleware"
          value={
            mwStatus === "loading"
              ? "..."
              : mwStatus === "up"
                ? "Online"
                : "Offline"
          }
        />
      </div>

      {/* Games by Sport */}
      <GamesSection />

      {/* Recent Predictions */}
      <RecentPredictions />

      {/* How it works */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-[var(--muted)]">
          <div className="space-y-2">
            <div className="text-2xl">1️⃣</div>
            <p className="font-medium text-white">Pick a Game</p>
            <p>
              Browse NBA, NFL, or MLB matchups and click on a game to make your
              prediction — minted as an NFT with a stake.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">2️⃣</div>
            <p className="font-medium text-white">AI Scores It</p>
            <p>
              After the game ends, Chainlink CRE triggers AI scoring via our
              middleware — your NFT gets a 0–100 accuracy score.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">3️⃣</div>
            <p className="font-medium text-white">Claim Rewards</p>
            <p>
              High-scoring predictions earn proportional ETH rewards. Redeem
              your NFT to claim.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
