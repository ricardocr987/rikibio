import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BigNumber from "bignumber.js";

export const symbolFromMint: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "MSOL",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
};

export const mintFromSymbol: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  MSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
};
export const decimalsFromSymbol: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  MSOL: 9,
  BONK: 5,
};

export const TEN = new BigNumber(10);
export const mintDecimals: Record<string, number> = {
  USDC: 6,
  SOL: 9,
};

export const HOUR_PRICE = 50;
export const USDC_AMOUNT = new BigNumber(HOUR_PRICE);
export const USDC_MINT = mintFromSymbol["USDC"];
export const USDC_DECIMALS = mintDecimals["USDC"];
export const USDC_MINT_KEY = new PublicKey(USDC_MINT);
export const [PAYMENT_REFERENCE] = PublicKey.findProgramAddressSync(
  [Buffer.from("riki", "utf-8")],
  SystemProgram.programId,
);
export const RIKI_PUBKEY = new PublicKey(
  "7PVikdh8e1mTjdZT4ooEYAZGR9McPRkdRjf1tkxxdyRp",
);
export const [USDC_TOKEN_ACCOUNT] = PublicKey.findProgramAddressSync(
  [
    RIKI_PUBKEY.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    new PublicKey(mintFromSymbol["USDC"]).toBuffer(),
  ],
  ASSOCIATED_TOKEN_PROGRAM_ID,
);
