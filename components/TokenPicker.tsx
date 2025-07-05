"use client";

import { TokenInfo } from "@/actions/types";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { ClipLoader } from "react-spinners";
import { LogOutIcon } from "lucide-react";
import { HOUR_PRICE } from "@/lib/constants";

export type TokenPickerProps = {
  tokens: TokenInfo[];
  selectedToken: TokenInfo | undefined;
  setSelectedToken: (token: TokenInfo) => void;
  handlePayment: () => void;
  quantity: number;
  loading: boolean;
};

export function TokenPicker({
  tokens,
  selectedToken,
  setSelectedToken,
  handlePayment,
  quantity,
  loading,
}: TokenPickerProps) {
  const { disconnect } = useWallet();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full gap-5">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
        Fetching tokens
      </div>
    );
  }

  if (!selectedToken) {
    if (tokens.length > 0) {
      // If we have tokens but no selectedToken, set the first one
      setSelectedToken(tokens[0]);
      return (
        <div className="flex justify-center items-center h-full w-full gap-5">
          <ClipLoader size={50} color={"#123abc"} loading={true} />
          Loading tokens...
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between w-full">
        <span className="px-2 text-sm">No tokens with more than {HOUR_PRICE}$ value</span>
        <Button
          type="button"
          onClick={disconnect}
          className="p-2 bg-[#22c55e] text-black rounded-md hover:bg-[#16a34a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22c55e]"
        >
          <LogOutIcon className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {selectedToken && (
        <>
          <div className="flex items-center space-x-2 w-full">
            <Select
              onValueChange={(value) =>
                setSelectedToken(
                  tokens.find((token) => token.metadata.symbol === value)!,
                )
              }
            >
              <SelectTrigger className="flex-1 flex items-center justify-between rounded-md border border-[#22c55e] bg-[#22c55e] text-black shadow-sm focus:border-[#22c55e] focus:ring focus:ring-[#22c55e] focus:ring-opacity-50">
                <span>{selectedToken.metadata.symbol}</span>
                <img
                  src={selectedToken.metadata.image}
                  alt={selectedToken.metadata.symbol}
                  className="w-7 h-7"
                />
              </SelectTrigger>
              <SelectContent className="bg-[#22c55e] text-black border-[#22c55e] focus-within:border-[#22c55e] focus-within:ring-[#22c55e]">
                <div className="px-4 py-2 font-medium text-black">
                  Pay per hour | 40 USD
                </div>
                {tokens.map((token) => (
                  <SelectItem
                    key={token.metadata.symbol}
                    value={token.metadata.symbol}
                    className="bg-[#22c55e] text-black hover:bg-[#4ade80] data-[state=checked]:bg-[#22c55e] data-[state=checked]:text-black focus:bg-[#4ade80] focus:text-black"
                  >
                    <div className="grid grid-cols-[auto_auto_1fr] gap-4 items-center">
                      <span>{token.metadata.symbol}</span>
                      <img
                        src={token.metadata.image}
                        alt={token.metadata.symbol}
                        width={28}
                        height={28}
                      />
                      <span className="text-right">{Number(token.value)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handlePayment}
              className="flex-1 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed]"
            >
              Pay {(
                Number(selectedToken.unitAmount || 0) * (quantity === 0 ? 1 : quantity)
              ).toFixed(2)} {selectedToken.metadata.symbol}
            </Button>
            <Button
              type="button"
              onClick={disconnect}
              className="p-2 bg-[#22c55e] text-black rounded-md hover:bg-[#16a34a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22c55e]"
            >
              <LogOutIcon className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
