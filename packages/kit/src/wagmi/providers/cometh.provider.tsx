"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { Config, createConfig, WagmiProvider } from "wagmi";

import { wagmiConfig } from "../../config/wagmi.js";

const queryClient = new QueryClient();

export function ComethProvider({
  children,
}: PropsWithChildren<{ config?: Config }>) {
  return (
    <WagmiProvider config={createConfig(wagmiConfig)}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
