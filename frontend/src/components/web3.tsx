import { WagmiProvider, http } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { hardhat } from "wagmi/chains";

import "@rainbow-me/rainbowkit/styles.css";
import { WALLETCONNECT_PROJECT_ID } from "../config";

const config = getDefaultConfig({
  appName: "DemocracyChain",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [hardhat],
  transports: {
    [hardhat.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
