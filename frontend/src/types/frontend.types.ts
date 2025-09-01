import type { Abi } from "viem";

export type DemocracyContract = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
} | null;
