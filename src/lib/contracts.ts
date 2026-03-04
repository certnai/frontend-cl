// Contract addresses on Sepolia
export const CONTRACTS = {
  predictionNFT: "0xF316Cd17AEe297945dc366561b0524FDE1DAFdE9" as const,
  stakingRegistry: "0x408467Ba752eA1298F21981130A3452a37B7403C" as const,
  sportsPredictionResolver:
    "0x301D2733Cb4Be5A832D8442A1a79608d8A751c93" as const,
  espnFinishedResolver:
    "0xB4A3dc809243b44BAa6099AAD6a729A330284b4F" as const,
  espnLiveResolver:
    "0x1174B8A1A8dC2e29a2C1D286208444e68BF8F3eE" as const,
  rewardLogic: "0xb01829C48EaE909D04Fd45894C2FA63CeF25B621" as const,
  nftMarketplace: "0xA20dbF086dAF43DAf23C4d55a91126ab76c0e402" as const,
} as const;

// Individual address exports for convenience
export const PREDICTION_NFT_ADDRESS = CONTRACTS.predictionNFT;
export const STAKING_REGISTRY_ADDRESS = CONTRACTS.stakingRegistry;
export const SPORTS_PREDICTION_RESOLVER_ADDRESS = CONTRACTS.sportsPredictionResolver;
export const ESPN_FINISHED_RESOLVER_ADDRESS = CONTRACTS.espnFinishedResolver;
export const ESPN_LIVE_RESOLVER_ADDRESS = CONTRACTS.espnLiveResolver;
export const REWARD_LOGIC_ADDRESS = CONTRACTS.rewardLogic;
export const NFT_MARKETPLACE_ADDRESS = CONTRACTS.nftMarketplace;

export const MIDDLEWARE_URL =
  process.env.NEXT_PUBLIC_MIDDLEWARE_URL || "http://localhost:8000";
