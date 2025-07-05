import BigNumber from "bignumber.js";

export type TokenInfo = {
  mint: string;
  address: string;
  amount: string;
  value: string;
  decimals: number;
  metadata: Metadata;
  unitAmount?: string;
};

export type Metadata = {
  name: string;
  symbol: string;
  image: string;
};

export type TokenPrice = {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
};

export type JupQuote = {
  [mint: string]: TokenPrice;
};

// Legacy type for backward compatibility with old price API
export type JupQuoteLegacy = {
  data: {
    [key: string]: {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: number;
    };
  };
  timeTaken: number;
};

export type Payment = {
  signature: string;
  signer: string;
  currency: string;
  amount: string;
  timestamp: string;
};

export type JupTokenInfo = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  circSupply: number;
  totalSupply: number;
  tokenProgram: string;
  firstPool: {
    id: string;
    createdAt: string;
  };
  holderCount: number;
  audit: {
    mintAuthorityDisabled: boolean;
    freezeAuthorityDisabled: boolean;
    topHoldersPercentage: number;
  };
  organicScore: number;
  organicScoreLabel: string;
  isVerified: boolean;
  cexes: string[];
  tags: string[];
  fdv: number;
  mcap: number;
  usdPrice: number;
  priceBlockId: number;
  liquidity: number;
  stats5m: {
    priceChange: number;
    liquidityChange: number;
    volumeChange: number;
    buyVolume: number;
    sellVolume: number;
    buyOrganicVolume: number;
    sellOrganicVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
    numOrganicBuyers: number;
    numNetBuyers: number;
  };
  stats1h: {
    priceChange: number;
    liquidityChange: number;
    volumeChange: number;
    buyVolume: number;
    sellVolume: number;
    buyOrganicVolume: number;
    sellOrganicVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
    numOrganicBuyers: number;
    numNetBuyers: number;
  };
  stats6h: {
    priceChange: number;
    liquidityChange: number;
    volumeChange: number;
    buyVolume: number;
    sellVolume: number;
    buyOrganicVolume: number;
    sellOrganicVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
    numOrganicBuyers: number;
    numNetBuyers: number;
  };
  stats24h: {
    priceChange: number;
    liquidityChange: number;
    volumeChange: number;
    buyVolume: number;
    sellVolume: number;
    buyOrganicVolume: number;
    sellOrganicVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
    numOrganicBuyers: number;
    numNetBuyers: number;
  };
  ctLikes: number;
  smartCtLikes: number;
  updatedAt: string;
};

export type JupQuoteResponse = {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  platformFee?: {
    amount?: string;
    feeBps?: number;
  };
  priceImpactPct: string;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label?: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
  }[];
  ammKey: string;
  label?: string;
  feeAmount: string;
  feeMint: string;
  percent: number;
  contextSlot?: number;
  timeTaken?: number;
};

export type JupInstructionAccount = {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
};

export type JupInstruction = {
  keys: string[];
  programId: string;
  data: string;
  accounts: JupInstructionAccount[];
};

export type JupSwapInstructionsResponse = {
  tokenLedgerInstruction: JupInstruction | null;
  computeBudgetInstructions: JupInstruction[];
  setupInstructions: JupInstruction[] | null;
  swapInstruction: JupInstruction;
  cleanupInstruction: JupInstruction | null;
  otherInstructions: JupInstruction[];
  addressLookupTableAddresses: string[];
  prioritizationFeeLamports: number;
};

export type JupSwapTransactionResponse = {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
};

export type UsdcValues = {
  [mint: string]: {
    price: BigNumber;
    totalValue: BigNumber;
  };
};
