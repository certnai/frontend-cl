import { MIDDLEWARE_URL } from "./contracts";

export interface GameData {
  game_id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status: string;
  winner?: string;
  sport?: string;
  is_finished?: boolean;
}

export interface ResolutionData {
  game_id: string;
  winner: string;
  final_score: string;
  confidence: number;
  analysis: string;
  prediction_scores: {
    token_id: number;
    predictor: string;
    accuracy_score: number;
  }[];
}

export interface LiveGameData {
  game_id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status: string;
  period: string;
  time_remaining: string;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${MIDDLEWARE_URL}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || "API error");
  return json.data;
}

export async function getGameResolution(
  gameId: string,
  sport = "nba"
): Promise<ResolutionData> {
  return fetchApi(`/api/v1/games/${gameId}/resolution?sport=${sport}`);
}

export async function getFinishedGame(
  gameId: string,
  sport = "nba"
): Promise<GameData> {
  return fetchApi(`/api/v1/games/${gameId}?sport=${sport}`);
}

export async function getLiveGame(
  gameId: string,
  sport = "nba"
): Promise<LiveGameData> {
  return fetchApi(`/api/v1/games/live?sport=${sport}&game_id=${gameId}`);
}

export interface BatchScoreResult {
  total_processed: number;
  total_errors: number;
  game_id: string;
  scores: { token_id: number; accuracy_score?: number; confidence?: string; model_used?: string; error?: string }[];
}

export async function scoreGamePredictions(
  gameId: string,
  sport = "nba"
): Promise<BatchScoreResult> {
  const res = await fetch(`${MIDDLEWARE_URL}/api/v1/predictions/batch-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: gameId, sport }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `API ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Scoring failed");
  return json.data as BatchScoreResult;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${MIDDLEWARE_URL}/health`);
  return res.json();
}

export interface UpcomingGame {
  game_id: string;
  name?: string;
  short_name?: string;
  home_team: string;
  away_team: string;
  home_score?: string | number | null;
  away_score?: string | number | null;
  date?: string;
  status?: string;
  status_detail?: string;
  venue?: string;
  sport?: string;
}

export async function getUpcomingGames(
  sport = "nba",
  daysAhead = 3,
): Promise<UpcomingGame[]> {
  const res = await fetch(
    `${MIDDLEWARE_URL}/api/v1/games/upcoming?sport=${sport}&days_ahead=${daysAhead}`,
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return json?.data?.games ?? [];
}
