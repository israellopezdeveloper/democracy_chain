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
  const [processedHtml, setProcessedHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const contract = useDemocracyContract();
  const publicClient = usePublicClient();

  // Carga datos del ciudadano y el HTML del programa
  useEffect(() => {
    if (!wallet) return;

    (async () => {
      try {
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

        const res = await fetch(`${BACKEND_URL}/${wallet}/program`);
        if (!res.ok) throw new Error("Programa no encontrado");
        const text = await res.text();
        setContent(text);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Error desconocido al cargar el programa",
        );
      }
    })();
  }, [wallet, BACKEND_URL, contract, publicClient]);

  // Procesa el HTML reemplazando wallets -> <b>Nombre</b>
  useEffect(() => {
    (async () => {
      if (!content) {
        setProcessedHtml("");
        return;
      }
      setProcessedHtml(content);
    })();
  }, [content, contract, publicClient]);

  // Manejo de estados
  if (!wallet) {
    return (
      <Modal
        title="📃 Error"
        message="Falta el parámetro ?wallet"
        onClose={() => {}}
        autoCloseDelay={4000}
        redirectTo="/candidates"
      />
    );
  }

  if (error) {
    return (
      <Modal
        title="📃 Error"
        message={error}
        onClose={() => {}}
        autoCloseDelay={4000}
        redirectTo="/candidates"
      />
    );
  }

  if (!content || !processedHtml) {
    return (
      <main>
        <div style={{ maxWidth: "none" }}>
          <img src="/freedom.svg" alt="Freedom" />
          <div>
            <h1>Democracy Chain</h1>
            <h2>Cargando programa…</h2>
          </div>
        </div>
      </main>
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
            // ✅ ahora __html es un string resuelto, no una Promise
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        </div>
      </div>
    </main>
  );
}
