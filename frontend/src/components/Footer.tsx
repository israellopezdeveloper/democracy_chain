import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract } from "../hooks/useDemocracyContract";
import { usePublicClient } from "wagmi";
import type { Abi, Address } from "viem";

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  throw new TypeError("Expected bigint-compatible value");
}

function toDateFromUnix(value: bigint): Date {
  const n = Number(value);
  const ms = n < 1e12 ? n * 1000 : n; // si viene en segundos → ms
  return new Date(ms);
}

export default function Footer() {
  const contract = useDemocracyContract();
  const publicClient = usePublicClient();

  const [registrationDate, setRegistrationDate] = useState<string>("");
  const [votingDate, setVotingDate] = useState<string>("");

  const loadDates = useCallback(async () => {
    if (!contract || !publicClient) return;

    const address = contract.address as Address;
    const abi = contract.abi as Abi;

    try {
      const regUnknown = await publicClient.readContract({
        address,
        abi,
        functionName: "REGISTRATION_DEADLINE",
        args: [],
      });
      const votUnknown = await publicClient.readContract({
        address,
        abi,
        functionName: "VOTING_DEADLINE",
        args: [],
      });

      const reg = toBigInt(regUnknown);
      const vot = toBigInt(votUnknown);

      const regDate = toDateFromUnix(reg);
      const votDate = toDateFromUnix(vot);

      setRegistrationDate(regDate.toLocaleString());
      setVotingDate(votDate.toLocaleString());
    } catch (e) {
      console.error("No se pudieron leer las fechas:", e);
      setRegistrationDate("—");
      setVotingDate("—");
    }
  }, [contract, publicClient]);

  useEffect(() => {
    void loadDates();
  }, [loadDates]);

  return (
    <footer className="footer">
      <div>📅 Inscripción: {registrationDate || "—"}</div>
      <div>📅 Votación: {votingDate || "—"}</div>
    </footer>
  );
}
