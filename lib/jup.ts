import {
  JupInstruction,
  JupQuote,
  JupQuoteResponse,
  JupSwapInstructionsResponse,
  JupSwapTransactionResponse,
  JupTokenInfo,
} from "@/actions/types";
import {
  PAYMENT_REFERENCE,
  TEN,
  USDC_AMOUNT,
  USDC_DECIMALS,
  USDC_MINT,
  USDC_TOKEN_ACCOUNT,
} from "./constants";
import { TransactionInstruction } from "@solana/web3.js";
import { deserializeInstruction } from "./solana";
import BigNumber from "bignumber.js";
import ky from "ky";

async function getJupQuote(
  inputMint: string,
  quantity: BigNumber,
): Promise<JupQuoteResponse> {
  const amount = String(
    USDC_AMOUNT.multipliedBy(quantity).times(TEN.pow(USDC_DECIMALS)),
  );

  return await ky
    .get("https://quote-api.jup.ag/v6/quote", {
      searchParams: {
        inputMint,
        outputMint: USDC_MINT,
        amount,
        swapMode: "ExactOut",
        slippageBps: 50,
        dexes: ["Whirlpool", "Raydium CLMM", "Raydium CP"].join(","),
      },
      retry: {
        limit: 5,
        statusCodes: [408, 413, 429, 500, 502, 503, 504, 422],
        methods: ["post"],
        delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
      },
    })
    .json<JupQuoteResponse>();
}

type JupInstructions = {
  jupInstructions: TransactionInstruction[];
  addressLookupTableAddresses: string[];
};

export async function getJupInstructions(
  signer: string,
  inputMint: string,
  quantity: BigNumber,
): Promise<JupInstructions> {
  const quoteResponse = await getJupQuote(inputMint, quantity);
  const {
    setupInstructions,
    swapInstruction,
    cleanupInstruction,
    otherInstructions,
    addressLookupTableAddresses,
  } = await ky
    .post("https://quote-api.jup.ag/v6/swap-instructions", {
      json: {
        quoteResponse,
        trackingAccount: PAYMENT_REFERENCE.toBase58(),
        userPublicKey: signer,
        wrapAndUnwrapSol: true,
        useSharedAccounts: false,
        dynamicComputeUnitLimit: false,
        skipUserAccountsRpcCalls: true,
        asLegacyTransaction: false,
        useTokenLedger: false,
      },
      retry: {
        limit: 5,
        statusCodes: [408, 413, 429, 500, 502, 503, 504, 422],
        methods: ["post"],
        delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
      },
    })
    .json<JupSwapInstructionsResponse>();

  const jupInstructions: TransactionInstruction[] = [];
  if (setupInstructions && setupInstructions.length > 0)
    jupInstructions.push(
      ...setupInstructions.map((ix: JupInstruction) =>
        deserializeInstruction(ix),
      ),
    );
  jupInstructions.push(deserializeInstruction(swapInstruction));
  if (cleanupInstruction)
    jupInstructions.push(deserializeInstruction(cleanupInstruction));
  if (otherInstructions && otherInstructions.length > 0)
    jupInstructions.push(
      ...otherInstructions.map((ix: JupInstruction) =>
        deserializeInstruction(ix),
      ),
    );

  return { jupInstructions, addressLookupTableAddresses };
}

export async function getJupTransaction(
  signer: string,
  inputMint: string,
  quantity: BigNumber,
): Promise<string> {
  const quoteResponse = await getJupQuote(inputMint, quantity);

  return await ky
    .post("https://quote-api.jup.ag/v6/swap", {
      json: {
        quoteResponse,
        destinationTokenAccount: USDC_TOKEN_ACCOUNT.toBase58(),
        trackingAccount: PAYMENT_REFERENCE.toBase58(),
        userPublicKey: signer,
        wrapAndUnwrapSol: true,
        useSharedAccounts: false,
        dynamicComputeUnitLimit: false,
        skipUserAccountsRpcCalls: true,
        asLegacyTransaction: false,
        useTokenLedger: false,
      },
      retry: {
        limit: 5,
        statusCodes: [408, 413, 429, 500, 502, 503, 504, 422],
        methods: ["post"],
        delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
      },
    })
    .json<JupSwapTransactionResponse>()
    .then((x) => x.swapTransaction);
}

export async function getPrice(
  currency: string,
  vsToken: string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
): Promise<number | null> {
  try {
    const priceUrl = "https://lite-api.jup.ag/price/v3";
    const priceResponse = await ky
      .get(priceUrl, {
        searchParams: {
          ids: currency,
        },
        retry: {
          limit: 5,
          statusCodes: [408, 413, 429, 500, 502, 503, 504],
          methods: ["get"],
          delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
        },
      })
      .json<JupQuote>();

    const tokenPrice = priceResponse[currency];
    return tokenPrice ? tokenPrice.usdPrice : null;
  } catch {
    return null;
  }
}

export async function getPrices(
  mints: string[],
  vsToken: string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
): Promise<JupQuote> {
  const priceUrl = "https://lite-api.jup.ag/price/v3";
  const results: JupQuote = {};

  // Function to fetch prices for a subset of mints (max 50 per request as per API docs)
  const fetchSubsetPrices = async (subset: string[]) => {
    const response = await ky
      .get(priceUrl, {
        searchParams: {
          ids: subset.join(","),
        },
        retry: {
          limit: 5,
          statusCodes: [408, 413, 429, 500, 502, 503, 504],
          methods: ["get"],
          delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
        },
      })
      .json<JupQuote>();

    Object.assign(results, response);
  };

  // Split mints into chunks of 50 (API limit)
  const chunkSize = 50;
  for (let i = 0; i < mints.length; i += chunkSize) {
    const subset = mints.slice(i, i + chunkSize);
    await fetchSubsetPrices(subset);
  }

  return results;
}

export async function getTokenInfo(mint: string) {
  try {
    const tokenInfoResponse = await ky
      .get(`https://lite-api.jup.ag/tokens/v2/search`, {
        searchParams: {
          query: mint,
        },
        retry: {
          limit: 5,
          statusCodes: [408, 413, 429, 500, 502, 503, 504, 422],
          methods: ["get"],
          delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
        },
      })
      .json<JupTokenInfo[]>();

    // Find the token that matches the exact mint address
    const tokenInfo = tokenInfoResponse.find(token => token.id === mint);
    
    if (!tokenInfo) {
      throw new Error(`Token not found for mint: ${mint}`);
    }

    return {
      mint: tokenInfo.id,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      image: tokenInfo.icon,
    };
  } catch (error) {
    console.error(`Failed to fetch token info for mint ${mint}:`, error);
    // Return a fallback object with basic info
    return {
      mint,
      name: "Unknown Token",
      symbol: "UNKNOWN",
      image: "",
    };
  }
}
