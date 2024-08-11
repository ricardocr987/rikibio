"use server";

import { db } from "@/lib/firebase";
import config from "@/lib/config";
import {
  HOUR_PRICE,
  mintDecimals,
  PAYMENT_REFERENCE,
  RIKI_PUBKEY,
  TEN,
  USDC_MINT,
} from "@/lib/constants";
import {
  AccountLayout,
  transferCheckedInstructionData,
} from "@solana/spl-token";
import { VersionedTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { generateMeet } from "@/lib/googleMeet";

export async function sendTransaction(transaction: string, data: string) {
  try {
    const deserializedTransaction = VersionedTransaction.deserialize(
      Buffer.from(transaction, "base64"),
    );
    const signature = await config.SOL_RPC.sendRawTransaction(
      deserializedTransaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 0,
      },
    );

    let confirmedTx: any = null;
    const latestBlockHash = await config.SOL_RPC.getLatestBlockhash();
    const confirmTransactionPromise = config.SOL_RPC.confirmTransaction(
      {
        signature,
        blockhash: deserializedTransaction.message.recentBlockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      },
      "confirmed",
    );

    while (!confirmedTx) {
      confirmedTx = await Promise.race([
        confirmTransactionPromise,
        new Promise((resolve) =>
          setTimeout(() => {
            resolve(null);
          }, 2000),
        ),
      ]);

      if (!confirmedTx) {
        await config.SOL_RPC.sendRawTransaction(
          deserializedTransaction.serialize(),
          {
            skipPreflight: true,
            maxRetries: 0,
          },
        );
      }
    }

    if (!confirmedTx) throw new Error("Transaction confirmation failed");

    const response = await fetchTransaction(signature);
    const { message } = response.transaction;
    const versionedTransaction = new VersionedTransaction(message);
    const instructions = versionedTransaction.message.compiledInstructions;

    const payInstruction = instructions.pop();
    if (!payInstruction) throw new Error("missing transfer instruction");

    const { amount: rawAmount } = transferCheckedInstructionData.decode(
      payInstruction.data,
    );
    const [source, mint, destination, owner, paymentReference] =
      payInstruction.accountKeyIndexes.map(
        (index: number) =>
          versionedTransaction.message.staticAccountKeys[index],
      );

    const sellerATA = await config.SOL_RPC.getAccountInfo(
      destination,
      "confirmed",
    );
    if (!sellerATA) throw new Error("error fetching ata info");
    const decodedSellerATA = AccountLayout.decode(sellerATA.data);

    const price = BigNumber(HOUR_PRICE)
      .times(TEN.pow(mintDecimals["USDC"]))
      .integerValue(BigNumber.ROUND_FLOOR);
    const signer = owner.toBase58();
    const seller = decodedSellerATA.owner.toBase58();
    const currency = decodedSellerATA.mint.toBase58();
    const amount = rawAmount.toString(16);
    const quotient = new BigNumber(amount, 16).dividedBy(price);

    if (!quotient.isInteger()) throw new Error("amount not transferred");
    if (PAYMENT_REFERENCE.toString() !== paymentReference.toString())
      throw new Error("wrong app reference");
    if (seller !== RIKI_PUBKEY.toBase58()) throw new Error("wrong seller");
    if (currency !== USDC_MINT) throw new Error("wrong seller");

    await db.collection(`cryptoPayment`).doc(signature).set({
      signature,
      signer,
      currency,
      amount,
      timestamp: new Date().toISOString(),
    });

    await generateMeet(data);

    return signature;
  } catch (error: any) {
    console.error("An error occurred:", error);
    return error.message;
  }
}

async function fetchTransaction(signature: string) {
  const retryDelay = 400;
  const response = await config.SOL_RPC.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (response) {
    return response;
  } else {
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    return fetchTransaction(signature);
  }
}
