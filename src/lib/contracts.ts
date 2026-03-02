// Contract addresses on Sepolia
export const CONTRACTS = {
  predictionNFT: "0xEF5A227ca940163b19FE5330617879222B680196" as const,
  stakingRegistry: "0x9Abb599159468FE92B8f44BC26056fA201150e72" as const,
  sportsPredictionResolver:
    "0x92704a093496C433e93B560A34471635c1d87E00" as const,
  espnFinishedResolver:
    "0x96EcAE3763C0d609B98C44B755CE0dD2505Bee3B" as const,
  espnLiveResolver:
    "0x7DF8EcE4D433f2Ac1fE7Ee5cf09e2023a1BDCF8B" as const,
  rewardLogic: "0xa56049C8D035EB50f597073D39Ee3CFD158545E8" as const,
} as const;

// Individual address exports for convenience
export const PREDICTION_NFT_ADDRESS = CONTRACTS.predictionNFT;
export const STAKING_REGISTRY_ADDRESS = CONTRACTS.stakingRegistry;
export const SPORTS_PREDICTION_RESOLVER_ADDRESS = CONTRACTS.sportsPredictionResolver;
export const ESPN_FINISHED_RESOLVER_ADDRESS = CONTRACTS.espnFinishedResolver;
export const ESPN_LIVE_RESOLVER_ADDRESS = CONTRACTS.espnLiveResolver;
export const REWARD_LOGIC_ADDRESS = CONTRACTS.rewardLogic;

export const MIDDLEWARE_URL =
  process.env.NEXT_PUBLIC_MIDDLEWARE_URL || "http://localhost:8000";
