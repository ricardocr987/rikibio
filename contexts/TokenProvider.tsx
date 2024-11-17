"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import ky from "ky";
import { useWallet } from "@solana/wallet-adapter-react";
import { TokenInfo } from "@/actions/types";
import config from "@/lib/config";

interface FetchTokensResponse {
  tokens: TokenInfo[];
}

interface TokenContextProps {
  tokens: TokenInfo[];
  loadingTokens: boolean;
  selectedToken?: TokenInfo;
  setSelectedToken: React.Dispatch<React.SetStateAction<TokenInfo | undefined>>;
}

const TokenContext = createContext<TokenContextProps | undefined>(undefined);

export const TokenProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>();

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!publicKey) return;

      setLoadingTokens(true);
      try {
        const response = await ky
          .get(`${config.APP_URL}/api/tokens`, {
            searchParams: {
              userKey: publicKey.toString(),
            },
          })
          .json<FetchTokensResponse>();

        if ("tokens" in response) {
          setTokens(response.tokens);
          setSelectedToken(response.tokens[0]);
        }
      } catch (error) {
        console.error("Failed to fetch tokens and balances", error);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchTokenInfo();
  }, [publicKey]);

  return (
    <TokenContext.Provider
      value={{ tokens, loadingTokens, selectedToken, setSelectedToken }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenContext = (): TokenContextProps => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
};
