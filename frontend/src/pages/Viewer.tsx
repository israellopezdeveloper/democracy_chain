import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Modal } from "../components/Modal";
import { usePublicClient } from "wagmi";
import {
  Citizen,
  useDemocracyContract,
} from "../hooks/useDemocracyContract";
import type { Abi, Address } from "viem";

export default function ViewerPage() {
  const [searchParams] = useSearchParams();
  const wallet = searchParams.get("wallet");
  const [name, setName] = useState<string>("");
  const [dni, setDni] = useState<string>("");
  const BACKEND_URL = import.meta.env["VITE_BACKEND_URL"];

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contract = useDemocracyContract();
  const publicClient = usePublicClient()!;

  useEffect(() => {
    if (!wallet) return;

    const fetchProgram = async () => {
      if (contract && publicClient) {
        const address = contract.address as Address;
        const abi = contract.abi as Abi;
        const citizenUnknown = await publicClient.readContract({
          address,
          abi,
          functionName: "citizens",
          args: [wallet],
        });
        // @ts-expect-error "Dynamic ABI import"
        const citizen: Citizen = new Citizen(citizenUnknown);
        setName(citizen.person.name);
        setDni(citizen.person.dni);
      }
      try {
        const res = await fetch(`${BACKEND_URL}/${wallet}/program`);
        if (!res.ok) throw new Error("Programa no encontrado");
        const text = await res.text();
        setContent(text);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido al cargar el programa");
        }
      }
    };

    void fetchProgram();
  }, [wallet, BACKEND_URL, contract, publicClient]);

  if (!wallet || error || !content) {
    return (
      <Modal
        title="📃 Error"
        message="No existe el programa"
        onClose={() => {}}
        autoCloseDelay={4000}
        redirectTo="/candidates"
      />
    );
  }

  return (
    <main>
      <div style={{ maxWidth: "none" }}>
        <img src="/freedom.svg" alt="Freedom" />
        <div>
          <h1>Democracy Chain</h1>
          <h2>
            📘 Programa Electoral de {name} ({dni})
          </h2>
          <div
            className="viewer"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </main>
  );
}
