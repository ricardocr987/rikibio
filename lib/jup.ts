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
) {
  try {
    const priceUrl = "https://price.jup.ag/v6/price";
    const priceResponse = await ky
      .get(priceUrl, {
        searchParams: {
          ids: currency,
          vsToken: vsToken,
        },
        retry: {
          limit: 5,
          statusCodes: [408, 413, 429, 500, 502, 503, 504],
          methods: ["get"],
          delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
        },
      })
      .json<JupQuote>();

    return priceResponse.data[currency].price;
  } catch {
    return null;
  }
}

export async function getPrices(
  mints: string[],
  vsToken: string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
): Promise<JupQuote> {
  const priceUrl = "https://price.jup.ag/v6/price";
  const results: JupQuote = { data: {}, timeTaken: 0 };

  // Function to create a query string and check its length
  const createQueryString = (ids: string[]) => {
    const params = new URLSearchParams({ ids: ids.join(","), vsToken });
    return `${priceUrl}?${params.toString()}`;
  };

  // Function to fetch prices for a subset of mints
  const fetchSubsetPrices = async (subset: string[]) => {
    const response = await ky
      .get(priceUrl, {
        searchParams: {
          ids: subset.join(","),
          vsToken,
        },
      })
      .json<JupQuote>();

    Object.assign(results.data, response.data);
  };

  // Split mints into smaller chunks
  let subset: string[] = [];
  for (const mint of mints) {
    const tempSubset = [...subset, mint];
    if (createQueryString(tempSubset).length > 4000) {
      await fetchSubsetPrices(subset);
      subset = [mint];
    } else {
      subset = tempSubset;
    }
  }

  if (subset.length > 0) {
    await fetchSubsetPrices(subset);
  }

  return results;
}

export async function getTokenInfo(mint: string) {
  const tokenInfo = await ky
    .get(`https://tokens.jup.ag/token/${mint}`)
    .json<JupTokenInfo>();
  console.log("tokenInfo", tokenInfo);
  return {
    mint,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    image: tokenInfo.logoURI,
  };
}
