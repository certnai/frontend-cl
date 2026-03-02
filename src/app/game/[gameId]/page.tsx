"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, parseEventLogs, keccak256, encodePacked } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import Link from "next/link";
import {
  PREDICTION_NFT_ADDRESS,
  SPORTS_PREDICTION_RESOLVER_ADDRESS,
} from "@/lib/contracts";
import { predictionNFTAbi, sportsPredictionResolverAbi } from "@/lib/abis";
import { getGameResolution, getFinishedGame, getLiveGame, scoreGamePredictions, registerPrediction, getGamePredictions } from "@/lib/api";
import type { GameData, ResolutionData, LiveGameData, BatchScoreResult, PredictionRecord } from "@/lib/api";

/* ───────── helper: ESPN game id → bytes32 ───────── */
// Must match SportsPredictionResolver: keccak256(abi.encodePacked(gameId))
function gameIdToBytes32(gameId: string): `0x${string}` {
  return keccak256(encodePacked(["string"], [gameId]));
}

/* ───────── helper: clean status label ───────── */
function cleanStatus(raw?: string): string {
  if (!raw) return "Unknown";
  if (raw.includes("FINAL")) return "Final";
  if (raw.includes("IN_PROGRESS")) return "Live";
  if (raw.includes("SCHEDULED")) return "Scheduled";
  if (raw.includes("POSTPONED")) return "Postponed";
  // Strip "STATUS_" prefix if present
  return raw.replace("STATUS_", "").replace(/_/g, " ");
}

/* ───────── game info card ───────── */
function GameInfoCard({
  gameId,
  resolution,
  finished,
  live,
}: {
  gameId: string;
  resolution: ResolutionData | null;
  finished: GameData | null;
  live: LiveGameData | null;
}) {
  const info = finished || live;
  const rawStatus = finished?.status || live?.status || "";
  const isFinal = rawStatus.includes("FINAL");
  const isLive = rawStatus.includes("IN_PROGRESS");

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Game #{gameId}</h2>
        {resolution ? (
          <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
            ✅ Resolved On-Chain
          </span>
        ) : isFinal ? (
          <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
            Final
          </span>
        ) : isLive ? (
          <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            🔴 Live
          </span>
        ) : info ? (
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
            Upcoming
          </span>
        ) : (
          <span className="text-xs px-3 py-1 rounded-full bg-gray-500/20 text-gray-400">
            No Data Yet
          </span>
        )}
      </div>

      {info && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {finished && (
            <>
              <div>
                <span className="text-[var(--muted)]">Home Team</span>
                <p className="text-white font-medium">
                  {finished.home_team} — {finished.home_score}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Away Team</span>
                <p className="text-white font-medium">
                  {finished.away_team} — {finished.away_score}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Winner</span>
                <p className="text-white font-medium">{finished.winner || "—"}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Status</span>
                <p className="text-white font-medium">{cleanStatus(finished.status)}</p>
              </div>
            </>
          )}
          {live && !finished && (
            <>
              <div>
                <span className="text-[var(--muted)]">Home Team</span>
                <p className="text-white font-medium">
                  {live.home_team} — {live.home_score}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Away Team</span>
                <p className="text-white font-medium">
                  {live.away_team} — {live.away_score}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Period</span>
                <p className="text-white font-medium">{live.period}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Clock</span>
                <p className="text-white font-medium">{live.time_remaining}</p>
              </div>
            </>
          )}
        </div>
      )}

      {resolution && (
        <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-green-400 font-medium mb-2">
            On-Chain Resolution
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-[var(--muted)]">Predictions Scored</span>
              <p className="text-white">
                {resolution.prediction_scores?.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── prediction form ───────── */
function PredictionForm({ gameId }: { gameId: string }) {
  const { address, isConnected } = useAccount();
  const [prediction, setPrediction] = useState("");
  const [sport, setSport] = useState("football");
  const [stakeEth, setStakeEth] = useState("0.001");

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Register prediction in middleware DB after successful mint
  useEffect(() => {
    if (!isSuccess || !receipt || !address) return;
    try {
      const logs = parseEventLogs({
        abi: predictionNFTAbi,
        eventName: "PredictionMinted",
        logs: receipt.logs,
      });
      if (logs.length === 0) return;
      const { tokenId, predictionText, sport: mintSport, gameId: gameIdBytes32, stakeAmount } = logs[0].args;
      registerPrediction({
        token_id: Number(tokenId),
        predictor_address: address,
        prediction_text: predictionText,
        game_id: gameIdBytes32,
        game_id_str: gameId,
        sport: mintSport,
        game_info: `ESPN Game ${gameId}`,
        stake_amount: Number(stakeAmount),
        blockchain_tx_hash: receipt.transactionHash,
      });
    } catch (e) {
      console.error("Failed to register prediction:", e);
    }
  }, [isSuccess, receipt, address, gameId]);

  function handleMint() {
    if (!address || !prediction) return;

    const gameIdBytes32 = gameIdToBytes32(gameId);

    writeContract({
      address: PREDICTION_NFT_ADDRESS,
      abi: predictionNFTAbi,
      functionName: "mintPrediction",
      args: [
        address,
        prediction,
        sport,
        `ESPN Game ${gameId}`,
        `https://certnai.xyz/nft/${gameId}`,
        gameIdBytes32,
      ],
      value: parseEther(stakeEth),
    });
  }

  if (!isConnected) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)] text-sm mb-4">
          Connect your wallet to make a prediction
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Make a Prediction</h2>

      <div>
        <label className="text-xs text-[var(--muted)] mb-1 block">
          Your Prediction
        </label>
        <textarea
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
          placeholder="e.g. Chiefs will win by 10+ points, Mahomes throws 3 TDs"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[var(--muted)] mb-1 block">
            Sport
          </label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="football">Football (NFL)</option>
            <option value="basketball">Basketball (NBA)</option>
            <option value="baseball">Baseball (MLB)</option>
            <option value="hockey">Hockey (NHL)</option>
            <option value="soccer">Soccer</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] mb-1 block">
            Stake (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={stakeEth}
            onChange={(e) => setStakeEth(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <button
        onClick={handleMint}
        disabled={isPending || isConfirming || !prediction}
        className="btn-primary w-full disabled:opacity-40"
      >
        {isPending
          ? "Confirm in Wallet..."
          : isConfirming
            ? "Minting..."
            : `Mint Prediction NFT (${stakeEth} ETH)`}
      </button>

      {isSuccess && hash && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
          <p className="text-green-400 font-medium">Prediction Minted!</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:underline break-all"
          >
            View on Etherscan →
          </a>
        </div>
      )}
    </div>
  );
}

/* ───────── game predictions list (on-chain) ───────── */
function GamePredictions({ gameId }: { gameId: string }) {
  const gameIdBytes32 = gameIdToBytes32(gameId);

  const { data: tokenIds } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getGameTokens",
    args: [gameIdBytes32],
  });

  const tokens = (tokenIds as bigint[]) ?? [];

  if (tokens.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)] text-sm">
          No predictions yet for this game.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">
        Predictions ({tokens.length})
      </h2>
      <div className="space-y-2">
        {tokens.map((tokenId) => (
          <PredictionRow key={tokenId.toString()} tokenId={tokenId} />
        ))}
      </div>
    </div>
  );
}

function PredictionRow({ tokenId }: { tokenId: bigint }) {
  const { data } = useReadContract({
    address: PREDICTION_NFT_ADDRESS,
    abi: predictionNFTAbi,
    functionName: "getPrediction",
    args: [tokenId],
  });

  const pred = data as
    | {
        predictor: string;
        predictionText: string;
        sport: string;
        score: bigint;
        resolved: boolean;
        stakeAmount: bigint;
      }
    | undefined;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-[var(--muted)]">
            #{tokenId.toString()}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {pred?.predictor
              ? `${pred.predictor.slice(0, 6)}...${pred.predictor.slice(-4)}`
              : ""}
          </span>
        </div>
        <p className="text-sm text-white truncate">
          {pred?.predictionText ?? "Loading..."}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {pred?.resolved ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            {pred.score.toString()}/100
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────── score predictions button ───────── */
function ScorePredictions({ gameId, sport, isFinal }: { gameId: string; sport: string; isFinal: boolean }) {
  const [loading, setLoading] = useState(false);
  const [allPredictions, setAllPredictions] = useState<PredictionRecord[]>([]);
  const [newlyProcessed, setNewlyProcessed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing predictions on mount
  useEffect(() => {
    if (isFinal) getGamePredictions(gameId).then(setAllPredictions);
  }, [gameId, isFinal]);

  async function handleScore() {
    setLoading(true);
    setError(null);
    try {
      const data = await scoreGamePredictions(gameId, sport);
      setNewlyProcessed(data.total_processed);
      // Refresh predictions list to pick up newly scored ones
      const updated = await getGamePredictions(gameId);
      setAllPredictions(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isFinal) return null;

  const scored = allPredictions.filter((p) => p.is_scored);
  const unscored = allPredictions.filter((p) => !p.is_scored);

  return (
    <div className="card p-6 space-y-3">
      <h2 className="text-lg font-semibold">Score Predictions (AI)</h2>
      <p className="text-xs text-[var(--muted)]">
        {allPredictions.length === 0
          ? "No predictions registered for this game yet."
          : `${scored.length} scored · ${unscored.length} unscored`}
      </p>

      {/* Existing scores */}
      {scored.length > 0 && (
        <div className="space-y-2">
          {scored.map((p) => (
            <div key={p.token_id} className="flex items-center gap-3 text-xs">
              <span className="font-mono text-indigo-400">#{p.token_id}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${p.score?.accuracy_score ?? 0}%`,
                    backgroundColor: (p.score?.accuracy_score ?? 0) >= 70 ? "#22c55e" : (p.score?.accuracy_score ?? 0) >= 40 ? "#eab308" : "#ef4444",
                  }}
                />
              </div>
              <span style={{ color: (p.score?.accuracy_score ?? 0) >= 70 ? "#22c55e" : (p.score?.accuracy_score ?? 0) >= 40 ? "#eab308" : "#ef4444" }}>
                {p.score?.accuracy_score ?? 0}/100
              </span>
              <span className="text-[var(--muted)]">{p.score?.model_used}</span>
            </div>
          ))}
        </div>
      )}

      {unscored.length > 0 && (
        <button
          onClick={handleScore}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-40"
        >
          {loading ? "Scoring..." : `Score ${unscored.length} Prediction${unscored.length > 1 ? "s" : ""} with AI`}
        </button>
      )}

      {newlyProcessed !== null && (
        <p className="text-blue-400 text-xs">
          {newlyProcessed > 0 ? `✓ Scored ${newlyProcessed} new prediction${newlyProcessed > 1 ? "s" : ""}.` : "All predictions already scored."}
          {" "}<span className="text-indigo-400">→ Now click "Request Resolution" below.</span>
        </p>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
          <p className="text-red-400 text-xs break-all">{error}</p>
        </div>
      )}
    </div>
  );
}

/* ───────── resolve trigger button ───────── */
function ResolveTrigger({ gameId }: { gameId: string }) {
  const { isConnected } = useAccount();

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function handleResolve() {
    writeContract({
      address: SPORTS_PREDICTION_RESOLVER_ADDRESS,
      abi: sportsPredictionResolverAbi,
      functionName: "requestResolution",
      args: [gameId],
    });
  }

  if (!isConnected) return null;

  return (
    <div className="card p-6 space-y-3">
      <h2 className="text-lg font-semibold">Trigger Resolution</h2>
      <p className="text-xs text-[var(--muted)]">
        Fire a CRE trigger to resolve this game's predictions via AI scoring.
        This emits an on-chain event that Chainlink CRE picks up.
      </p>
      <button
        onClick={handleResolve}
        disabled={isPending || isConfirming}
        className="btn-primary w-full disabled:opacity-40"
      >
        {isPending
          ? "Confirm in Wallet..."
          : isConfirming
            ? "Waiting for TX..."
            : "Request Resolution (CRE Trigger)"}
      </button>
      {isSuccess && hash && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm space-y-2">
          <p className="text-green-400 font-medium">Resolution Requested!</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:underline break-all block"
          >
            View on Etherscan →
          </a>
          <div className="mt-2 p-2 rounded bg-black/40 border border-white/10">
            <p className="text-xs text-[var(--muted)] mb-1">Run CRE simulation (paste in terminal):</p>
            <code className="text-xs text-yellow-300 break-all block">
              {`cre workflow simulate ./sports-prediction --target local-simulation -R . --non-interactive --trigger-index 0 --evm-tx-hash ${hash} --evm-event-index 0 --broadcast`}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`cd /mnt/d/certnai/core-cl/cre-workflow && cre workflow simulate ./sports-prediction --target local-simulation -R . --non-interactive --trigger-index 0 --evm-tx-hash ${hash} --evm-event-index 0 --broadcast`)}
              className="mt-2 text-xs px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 transition"
            >
              Copy full command
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
          <p className="text-red-400 text-xs break-all">
            {error.message.slice(0, 200)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────── main page ───────── */
export default function GamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [resolution, setResolution] = useState<ResolutionData | null>(null);
  const [finished, setFinished] = useState<GameData | null>(null);
  const [live, setLive] = useState<LiveGameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    async function load() {
      setLoading(true);
      try {
        const [resData, finData, liveData] = await Promise.allSettled([
          getGameResolution(gameId),
          getFinishedGame(gameId),
          getLiveGame(gameId),
        ]);
        if (resData.status === "fulfilled") setResolution(resData.value);
        if (finData.status === "fulfilled") setFinished(finData.value);
        if (liveData.status === "fulfilled") setLive(liveData.value);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gameId]);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="text-sm text-[var(--muted)] hover:text-white transition"
      >
        ← Back to Home
      </Link>

      {loading ? (
        <div className="card p-12 text-center">
          <p className="text-[var(--muted)]">Loading game data...</p>
        </div>
      ) : (
        <>
          <GameInfoCard
            gameId={gameId}
            resolution={resolution}
            finished={finished}
            live={live}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <PredictionForm gameId={gameId} />
            <ResolveTrigger gameId={gameId} />
          </div>
          <ScorePredictions
            gameId={gameId}
            sport={finished?.sport || "nba"}
            isFinal={!!(finished?.status?.includes("FINAL"))}
          />
          <GamePredictions gameId={gameId} />
        </>
      )}
    </div>
  );
}
