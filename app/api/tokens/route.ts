// note: is recommended to use api handlers to get data instead of actions
import { PublicKey } from "@solana/web3.js";
import config from "@/lib/config";
import BigNumber from "bignumber.js";
import { HOUR_PRICE, mintDecimals, mintFromSymbol } from "@/lib/constants";
import { DecodedMint, Mint, MintLayout, getTokenAccounts } from "@/lib/solana";
import { db } from "@/lib/firebase";
import { getTokenInfo, getPrices, getPrice } from "@/lib/jup";
import { Metadata, TokenInfo } from "@/actions/types";
import { NextResponse } from "next/server";

const threshold = new BigNumber(HOUR_PRICE);

async function fetchTokens(userKey: string): Promise<TokenInfo[]> {
  const tokenAccounts = await getTokenAccounts(userKey);
  const mintAddresses = tokenAccounts.map((x) => x.data.mint.toBase58());
  const [mints, prices] = await Promise.all([
    getMints(mintAddresses),
    getPrices(mintAddresses),
  ]);

  const tokens = await Promise.all(
    tokenAccounts.map(async (accountData) => {
      try {
        const mint = accountData.data.mint.toBase58();
        const mintData = mints[mint];
        const amount = accountData.data.amount.dividedBy(
          new BigNumber(10).pow(mintData.decimals),
        );

        const price = prices.data[mint].price;
        const totalValue = amount.multipliedBy(new BigNumber(price));
        if (totalValue.isLessThan(threshold)) return null;

        const metadata = await getMetadata(mint);
        return {
          mint,
          address: accountData.pubkey,
          amount: amount.toFixed(2),
          value: threshold.dividedBy(price).toFixed(2).toString(),
          decimals: mintData.decimals,
          metadata,
        } as TokenInfo;
      } catch (e: any) {
        return null;
      }
    }),
  );

  const filteredTokens = tokens.filter(
    (token) => token !== null,
  ) as TokenInfo[];

  const solMint = mintFromSymbol["SOL"];
  const solDecimals = mintDecimals["SOL"];
  const solBalance = await config.SOL_RPC.getBalance(new PublicKey(userKey));
  const solAmount = new BigNumber(solBalance).dividedBy(
    new BigNumber(10).pow(solDecimals),
  );
  const price = await getPrice(solMint);
  if (price) {
    const priceBN = new BigNumber(price);
    const solValue = new BigNumber(HOUR_PRICE).dividedBy(priceBN);
    const totalValue = solAmount.multipliedBy(priceBN);
    if (totalValue.isGreaterThan(HOUR_PRICE)) {
      filteredTokens.push({
        mint: solMint,
        address: userKey,
        amount: solAmount.toString(),
        value: solValue.toFixed(2),
        decimals: solDecimals,
        metadata: {
          name: "Solana",
          symbol: "SOL",
          image: "/solanaLogo.svg",
        },
      });
    }
  }

  return filteredTokens;
}

async function getMints(mints: string[]): Promise<Record<string, DecodedMint>> {
  const missingMints: PublicKey[] = [];

  const cachedData = await Promise.all(
    mints.map(async (mint, index) => {
      const cacheMint = await db.collection("mint").doc(mint).get();

      if (cacheMint.exists) {
        return cacheMint.data() as DecodedMint;
      } else {
        missingMints.push(new PublicKey(mint));
        return null;
      }
    }),
  );

  const filteredCachedData = cachedData.filter(
    (x) => x !== null,
  ) as DecodedMint[];
  const fetchedData = await fetchMints(missingMints);
  const combinedData: Record<string, DecodedMint> = {};

  filteredCachedData.forEach((data, idx) => {
    combinedData[mints[idx]] = data;
  });

  return { ...combinedData, ...fetchedData };
}

async function fetchMints(
  missingMints: PublicKey[],
): Promise<Record<string, DecodedMint>> {
  if (missingMints.length === 0) return {};

  const mintsResponse =
    await config.SOL_RPC.getMultipleAccountsInfo(missingMints);

  const newMintData: Record<string, DecodedMint> = {};
  await Promise.all(
    mintsResponse.map(async (mint, index) => {
      if (mint && mint.data) {
        const decodedMintData = MintLayout.decode(mint.data) as Mint;
        const mintAddress = missingMints[index].toBase58();
        const mintData = {
          mint: mintAddress,
          mintAuthorityOption: decodedMintData.mintAuthorityOption,
          mintAuthority: decodedMintData.mintAuthority.toBase58(),
          supply: decodedMintData.supply.toString(),
          decimals: decodedMintData.decimals,
          isInitialized: decodedMintData.isInitialized,
          freezeAuthorityOption: decodedMintData.freezeAuthorityOption,
          freezeAuthority: decodedMintData.freezeAuthority.toBase58(),
        };
        await db.collection("mint").doc(mintAddress).set(mintData);
        newMintData[mintAddress] = mintData;
      }
    }),
  );

  return newMintData;
}

async function getMetadata(mint: string): Promise<Metadata> {
  const cachedMetadata = await db.collection("metadata").doc(mint).get();
  if (cachedMetadata.exists) {
    const metadata = cachedMetadata.data() as any;
    return {
      name: metadata.name,
      symbol: metadata.symbol,
      image: metadata.image,
    };
  }

  const metadata = await getTokenInfo(mint);
  await db.collection("metadata").doc(mint).set(metadata);
  return {
    name: metadata.name,
    symbol: metadata.symbol,
    image: metadata.image,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    const userKey = searchParams.get("userKey");
    if (!userKey)
      return NextResponse.json(
        { message: "Invalid or missing userKey" },
        { status: 400 },
      );

    const tokens = await fetchTokens(userKey);
    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch tokens" },
      { status: 500 },
    );
  }
}

export type FetchTokensResponse = { tokens: TokenInfo[] } | { message: string };
