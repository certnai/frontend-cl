export const predictionNFTAbi = [
  {
    type: "function",
    name: "mintPrediction",
    inputs: [
      { name: "to", type: "address" },
      { name: "predictionText", type: "string" },
      { name: "sport", type: "string" },
      { name: "gameInfo", type: "string" },
      { name: "tokenURI_c", type: "string" },
      { name: "gameId", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "predictions",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "predictionText", type: "string" },
      { name: "sport", type: "string" },
      { name: "gameInfo", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "predictor", type: "address" },
      { name: "isScored", type: "bool" },
      { name: "accuracyScore", type: "uint256" },
      { name: "gameId", type: "bytes32" },
      { name: "stakeAmount", type: "uint256" },
      { name: "isRedeemed", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserPredictions",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPrediction",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "predictionText", type: "string" },
          { name: "sport", type: "string" },
          { name: "gameInfo", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "predictor", type: "address" },
          { name: "isScored", type: "bool" },
          { name: "accuracyScore", type: "uint256" },
          { name: "gameId", type: "bytes32" },
          { name: "stakeAmount", type: "uint256" },
          { name: "isRedeemed", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isNFTRedeemable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "redeemable", type: "bool" },
      { name: "reason", type: "string" },
      { name: "rewardAmount", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "redeemNFT",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGameTokens",
    inputs: [{ name: "gameId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "PredictionMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "predictor", type: "address", indexed: true },
      { name: "predictionText", type: "string", indexed: false },
      { name: "sport", type: "string", indexed: false },
      { name: "gameId", type: "bytes32", indexed: false },
      { name: "stakeAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PredictionScored",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "accuracyScore", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "NFTRedeemed",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "rewardAmount", type: "uint256", indexed: false },
      { name: "gameId", type: "bytes32", indexed: true },
    ],
  },
] as const;

export const sportsPredictionResolverAbi = [
  {
    type: "function",
    name: "requestResolution",
    inputs: [{ name: "gameId", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "gameResolved",
    inputs: [{ name: "gameId", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllGameResolutions",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "gameId", type: "string" },
          { name: "winner", type: "string" },
          { name: "finalScore", type: "string" },
          { name: "confidence", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ResolutionRequested",
    inputs: [{ name: "gameId", type: "string", indexed: false }],
  },
  {
    type: "event",
    name: "GameResolved",
    inputs: [
      { name: "gameId", type: "string", indexed: false },
      { name: "winner", type: "string", indexed: false },
      { name: "finalScore", type: "string", indexed: false },
      { name: "confidence", type: "uint256", indexed: false },
    ],
  },
] as const;

export const stakingRegistryAbi = [
  {
    type: "function",
    name: "getGameStakeInfo",
    inputs: [{ name: "gameId", type: "bytes32" }],
    outputs: [
      { name: "totalStaked", type: "uint256" },
      { name: "totalStakers", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "isResolved", type: "bool" },
      { name: "totalRewardPool", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getClaimableReward",
    inputs: [
      { name: "gameId", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalStaked",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const nftMarketplaceAbi = [
  {
    type: "function",
    name: "listNFT",
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyNFT",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "cancelListing",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getActiveListings",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "nftContract", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "listedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isListed",
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getListingByToken",
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "nftContract", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "listedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "marketplaceFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "NFTListed",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "nftContract", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "NFTSold",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "nftContract", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: false },
      { name: "buyer", type: "address", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ListingCancelled",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "nftContract", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: false },
    ],
  },
] as const;
