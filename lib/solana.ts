import { publicKey, struct, u32, u64, u8 } from "@coral-xyz/borsh";
import {
  PAYMENT_REFERENCE,
  USDC_DECIMALS,
  USDC_MINT_KEY,
  USDC_TOKEN_ACCOUNT,
} from "./constants";
import config from "@/lib/config";
import BigNumber from "bignumber.js";
import {
  AccountInfo,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";
import { db } from "./firebase";
import ky from "ky";
import { JupInstruction, JupInstructionAccount } from "@/actions/types";

export type DecodedMint = {
  mintAuthorityOption: number;
  mintAuthority: string;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthorityOption: number;
  freezeAuthority: string;
};

export type Mint = {
  mintAuthorityOption: number;
  mintAuthority: PublicKey;
  supply: BigInt;
  decimals: number;
  isInitialized: boolean;
  freezeAuthorityOption: number;
  freezeAuthority: PublicKey;
};

export const MintLayout = struct([
  u32("mintAuthorityOption"),
  publicKey("mintAuthority"),
  u64("supply"),
  u8("decimals"),
  u8("isInitialized"),
  u32("freezeAuthorityOption"),
  publicKey("freezeAuthority"),
]);

export async function getTokenAccounts(userKey: string) {
  const publicKey = new PublicKey(userKey);
  const tokenAccounts = await config.SOL_RPC.getTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

  const accountDatas = tokenAccounts.value.map((account) => ({
    pubkey: account.pubkey.toBase58(),
    data: AccountLayout.decode(account.account.data),
  }));

  return accountDatas
    .map((x) => ({
      ...x,
      data: {
        ...x.data,
        amount: new BigNumber(x.data.amount.toString()),
      },
    }))
    .filter((x) => x.data.amount.isGreaterThan(0));
}

export async function getMintData(mintKey: PublicKey) {
  const mint = mintKey.toBase58();
  const cacheMint = await db.collection(`mint`).doc(mint).get();

  if (cacheMint.exists) {
    const mintData = cacheMint.data() as any;
    return {
      mintAuthorityOption: mintData.mintAuthorityOption,
      mintAuthority: new PublicKey(mintData.mintAuthority),
      supply: BigInt(mintData.supply),
      decimals: mintData.decimals,
      isInitialized: !!mintData.isInitialized,
      freezeAuthorityOption: mintData.freezeAuthorityOption,
      freezeAuthority: new PublicKey(mintData.freezeAuthority),
    };
  }

  const response = await config.SOL_RPC.getAccountInfo(mintKey);
  if (!response) throw new Error("Failed to get program accounts");

  const decodedMintData = MintLayout.decode(response.data);
  await db
    .collection(`mint`)
    .doc(mint)
    .set({
      mint,
      mintAuthorityOption: decodedMintData.mintAuthorityOption,
      mintAuthority: decodedMintData.mintAuthority.toBase58(),
      supply: decodedMintData.supply.toString(),
      decimals: decodedMintData.decimals,
      isInitialized: decodedMintData.isInitialized ? 1 : 0,
      freezeAuthorityOption: decodedMintData.freezeAuthorityOption,
      freezeAuthority: decodedMintData.freezeAuthority.toBase58(),
    });

  return decodedMintData;
}

export async function getInstructions(
  initialInstructions: TransactionInstruction[],
  addressLookupTableAccounts: AddressLookupTableAccount[] | undefined,
  payerKey: PublicKey,
): Promise<TransactionInstruction[]> {
  const instructions = [...initialInstructions];
  const simulatedComputeBudgetInstruction =
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 });
  const simulatedComputePriceInstruction =
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 });
  instructions.unshift(
    simulatedComputeBudgetInstruction,
    simulatedComputePriceInstruction,
  );

  const message = new TransactionMessage({
    payerKey,
    recentBlockhash: PublicKey.default.toString(),
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);

  const transaction = new VersionedTransaction(message);
  const rpcResponse = await config.SOL_RPC.simulateTransaction(transaction, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });

  const units = rpcResponse.value.unitsConsumed || 1400000;
  const microLamports = (await getPriorityFee("High", transaction)) || 5000;
  const computePriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  });
  const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
    units,
  });
  initialInstructions.unshift(
    computeBudgetInstruction,
    computePriceInstruction,
  );

  return initialInstructions;
}

export async function createSystemInstruction(
  recipient: PublicKey,
  amount: BigNumber,
  sender: PublicKey,
  senderInfo: AccountInfo<Buffer>,
): Promise<TransactionInstruction> {
  if (!senderInfo.owner.equals(SystemProgram.programId))
    throw new Error("sender owner invalid");
  if (senderInfo.executable) throw new Error("sender executable");

  // Check that the amount provided doesn't have greater precision than SOL
  if ((amount.decimalPlaces() ?? 0) > 9)
    throw new Error("amount decimals invalid");

  // Convert input decimal amount to integer lamports
  amount = amount.times(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_FLOOR);

  // Check that the sender has enough lamports
  const lamports = amount.toNumber();
  if (lamports > senderInfo.lamports) throw new Error("insufficient funds");

  // Create an instruction to transfer native SOL
  return SystemProgram.transfer({
    fromPubkey: sender,
    toPubkey: recipient,
    lamports,
  });
}

export async function createPayInstruction(
  amount: string,
  sender: PublicKey,
  senderATA: PublicKey,
): Promise<TransactionInstruction> {
  // Check that the sender has enough tokens
  const tokens = BigInt(amount);

  // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
  const payInstruction = createTransferCheckedInstruction(
    senderATA,
    USDC_MINT_KEY,
    USDC_TOKEN_ACCOUNT,
    sender,
    tokens,
    USDC_DECIMALS,
  );
  payInstruction.keys.push({
    pubkey: PAYMENT_REFERENCE,
    isWritable: false,
    isSigner: false,
  });

  return payInstruction;
}

export async function getAddressLookupTableAccounts(
  keys: string[],
): Promise<AddressLookupTableAccount[] | undefined> {
  if (keys.length === 0) return undefined;

  const addressLookupTableAccountInfos =
    await config.SOL_RPC.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key)),
    );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
}

export function deserializeInstruction(instruction: JupInstruction) {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: JupInstructionAccount) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, "base64"),
  });
}

export async function getTransaction(
  initialInstructions: TransactionInstruction[],
  payerKey: PublicKey,
  addressLookupTableAddresses: string[],
): Promise<string> {
  const addressLookupTableAccounts = await getAddressLookupTableAccounts(
    addressLookupTableAddresses,
  );
  const instructions = await getInstructions(
    initialInstructions,
    addressLookupTableAccounts,
    payerKey,
  );
  const recentBlockhash = (await config.SOL_RPC.getLatestBlockhash("finalized"))
    .blockhash;
  const messageV0 = new TransactionMessage({
    payerKey,
    recentBlockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);
  const transaction = new VersionedTransaction(messageV0);
  return Buffer.from(transaction.serialize()).toString("base64");
}

type HeliusPriorityFee = {
  jsonrpc: string;
  result: {
    priorityFeeEstimate: number;
  };
  id: string;
};

async function getPriorityFee(
  priorityLevel: string,
  transaction: VersionedTransaction,
) {
  return await ky
    .post(config.SOL_RPC.rpcEndpoint, {
      json: {
        jsonrpc: "2.0",
        id: "1",
        method: "getPriorityFeeEstimate",
        params: [
          {
            transaction: bs58.encode(transaction.serialize()),
            options: { priorityLevel },
          },
        ],
      },
      retry: {
        limit: 5,
        methods: ["post"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
      },
    })
    .json<HeliusPriorityFee>()
    .then((x) => x.result.priorityFeeEstimate);
}
