// Contract addresses on Sepolia
export const CONTRACTS = {
  predictionNFT: "0x6B81606083C7ad420417aCf95134F7499f797d8F" as const,
  stakingRegistry: "0xD1Fe116204B893eCF2a3521225f2E2FdA431907A" as const,
  sportsPredictionResolver:
    "0xbc406560189c561fedf79609f103a21456f239EC" as const,
  espnFinishedResolver:
    "0x58ED026c9D0f1B08448884b380CfBcc945BccB7F" as const,
  espnLiveResolver:
    "0x6Cae278EdFaDF0c1259a4bD2C4B403243Dc905D9" as const,
  rewardLogic: "0x33f53dD2E2a1dCCA1fA458F9CCaEBD211Ae12748" as const,
  nftMarketplace: "0x493A19bbeF53d498A765413053080FEDAE594154" as const,
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
