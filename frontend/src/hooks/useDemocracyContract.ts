import { usePublicClient, useWalletClient } from "wagmi";
import { getContract } from "viem";
import { useEffect, useState } from "react";

import type { Abi, Chain, PublicClient, Transport } from "viem";
import type { DemocracyContract } from "../types/frontend.types";

interface ContractInfo {
  abi: Abi;
  address: `0x${string}`;
  network: string;
}

export function useDemocracyContract(): DemocracyContract {
  const publicClient = usePublicClient() as PublicClient<Transport, Chain>;
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState<ReturnType<
    typeof getContract
  > | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      const API_URL =
        import.meta.env["VITE_CONTRACT_API_URL"] || "http://localhost:3000";

      const [abi, { address }]: [Abi, ContractInfo] = await Promise.all([
        fetch(`${API_URL}/abi`).then((res) => res.json()),
        fetch(`${API_URL}/address`).then((res) => res.json()),
      ]);

      const client = walletClient ?? publicClient;
      if (!client || !abi || !address) return;

      const instance = getContract({
        abi,
        address,
        client,
      });

      setContract({ ...instance, abi });
    };

    fetchContract();
  }, [walletClient, publicClient]);

  return contract;
}

type PersonInput =
  | { dni: string; name: string; wallet: string }
  | [string, string, string]
  | null
  | undefined;

type CitizenInput =
  | { person: PersonInput; isRegistered: boolean; voted: boolean }
  | [PersonInput, boolean, boolean]
  | null;

type CandidateInput =
  | { citizen: CitizenInput; voteCount: bigint }
  | [CitizenInput, bigint]
  | null;

export class Person {
  dni: string;
  name: string;
  wallet: string;

  constructor(data: PersonInput) {
    if (Array.isArray(data)) {
      const [dni, name, wallet] = data;
      this.dni = dni;
      this.name = name;
      this.wallet = wallet;
    } else if (
      data &&
      typeof data === "object" &&
      "dni" in data &&
      "name" in data &&
      "wallet" in data
    ) {
      this.dni = data.dni;
      this.name = data.name;
      this.wallet = data.wallet;
    } else {
      this.dni = "";
      this.name = "";
      this.wallet = "0x0000000000000000000000000000000000000000";
    }
  }
}

export class Citizen {
  person: Person;
  registered: boolean;
  voted: boolean;

  constructor(data: CitizenInput) {
    if (Array.isArray(data)) {
      const [personInput, registered, voted] = data;
      this.person = new Person(personInput);
      this.registered = !!registered;
      this.voted = !!voted;
    } else if (
      data &&
      typeof data === "object" &&
      "person" in data &&
      "registered" in data &&
      "voted" in data
    ) {
      this.person = new Person(data.person);
      this.registered = !!data.registered;
      this.voted = !!data.voted;
    } else {
      this.person = new Person(null);
      this.registered = false;
      this.voted = false;
    }
  }
}

export class Candidate {
  citizen: Citizen;
  voteCount: bigint;

  constructor(data: CandidateInput) {
    if (Array.isArray(data)) {
      const [citizenInput, voteCount] = data;
      this.citizen = new Citizen(citizenInput);
      this.voteCount = voteCount ?? BigInt(0);
    } else if (
      data &&
      typeof data === "object" &&
      "citizen" in data &&
      "voteCount" in data
    ) {
      this.citizen = new Citizen(data.citizen);
      this.voteCount = data.voteCount ?? BigInt(0);
    } else {
      this.citizen = new Citizen(null);
      this.voteCount = BigInt(0);
    }
  }
}
