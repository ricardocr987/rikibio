"use server";

import config from "@/lib/config";
import {
  TEN,
  USDC_AMOUNT,
  USDC_DECIMALS,
  USDC_MINT,
  USDC_MINT_KEY,
} from "@/lib/constants";
import { getJupInstructions, getTokenInfo } from "@/lib/jup";
import { createPayInstruction, getTransaction } from "@/lib/solana";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";

export async function createTransaction(
  pubkey: string,
  quantity: string,
  currency: string,
  decimals: number,
) {
  try {
    const signer = new PublicKey(pubkey);
    const senderATA = await getAssociatedTokenAddress(USDC_MINT_KEY, signer);
    const senderAccount = await getAccount(config.SOL_RPC, senderATA);
    if (!senderAccount.isInitialized) throw new Error("sender not initialized");
    if (senderAccount.isFrozen) throw new Error("sender frozen");

    const quantityBN = new BigNumber(quantity);
    const amount = String(
      USDC_AMOUNT.multipliedBy(quantityBN)
        .times(TEN.pow(USDC_DECIMALS))
        .integerValue(BigNumber.ROUND_FLOOR),
    );

    const instructions: TransactionInstruction[] = [];
    const lookupTableAddresses: string[] = [];
    if (currency !== USDC_MINT) {
      const metadata = await getTokenInfo(currency);
      const { addressLookupTableAddresses, jupInstructions } =
        await getJupInstructions(pubkey, currency, quantityBN);

      instructions.push(...jupInstructions);
      lookupTableAddresses.push(...addressLookupTableAddresses);

      // check final USDC value here also
    } else {
      const tokens = BigInt(amount);
      if (tokens > senderAccount.amount) throw new Error("insufficient funds");
    }

    const payInstruction = await createPayInstruction(
      amount,
      signer,
      senderATA,
    );
    instructions.push(payInstruction);

    return await getTransaction(instructions, signer, lookupTableAddresses);
  } catch (error: any) {
    console.error("Transaction creation failed:", error.message);
  }
}
