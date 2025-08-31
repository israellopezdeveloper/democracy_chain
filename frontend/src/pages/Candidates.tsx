import { useState, useEffect, useCallback } from "react";
import {
  useDemocracyContract,
  Candidate,
  Citizen,
} from "../hooks/useDemocracyContract";
import { Modal } from "../components/Modal";
import { useLocation, Link } from "react-router-dom";
import { usePublicClient } from "wagmi";
import ChatBox from "../components/ChatBox";
import type { Address, Abi } from "viem";

interface CandidateItem {
  dni: string;
  name: string;
  wallet: string;
  votes: string; // bigint -> string para serializar
}

function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") return BigInt(v);
  throw new TypeError("Expected bigint-compatible value");
}

export default function CandidatesPage() {
  const contract = useDemocracyContract();
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [showErrorCandidateModal, setShowErrorCandidateModal] = useState("");
  const [filterWallets, setFilterWallets] = useState<string[] | null>(null);

  const publicClient = usePublicClient()!;
  const location = useLocation();

  // Cargar últimos candidatos desde localStorage
  useEffect(() => {
    const savedCandidates = localStorage.getItem("lastCandidates");
    if (savedCandidates) {
      try {
        const parsed = JSON.parse(savedCandidates);
        setCandidates(parsed);
      } catch (e) {
        console.warn(
          "No se pudieron cargar los candidatos desde localStorage.",
          e,
        );
      }
    }
    const savedFilter = localStorage.getItem("filterWallets");
    if (savedFilter) {
      setFilterWallets(JSON.parse(savedFilter));
    }
  }, []);

  // Persistir filterWallets
  useEffect(() => {
    if (filterWallets && filterWallets.length > 0) {
      localStorage.setItem("filterWallets", JSON.stringify(filterWallets));
    } else {
      localStorage.removeItem("filterWallets");
    }
  }, [filterWallets]);

  const fetchCandidates = useCallback(async () => {
    if (!contract || !publicClient) return;
    try {
      const address = contract.address as Address;
      const abi = contract.abi as Abi;

      // getCandidateCount() -> bigint
      const countUnknown = await publicClient.readContract({
        address,
        abi,
        functionName: "getCandidateCount",
        args: [],
      });
      const count = toBigInt(countUnknown);

      const list: CandidateItem[] = [];
      for (let i = 0; i < Number(count); i++) {
        // getCandidateByIndex(uint256) -> struct Candidate
        const candUnknown = await publicClient.readContract({
          address,
          abi,
          functionName: "getCandidateByIndex",
          args: [BigInt(i)],
        });
        // Adaptador a tu clase Candidate
        // @ts-expect-error "Dynamic ABI import"
        const candidate: Candidate = new Candidate(candUnknown);

        list.push({
          dni: candidate.citizen.person.dni,
          name: candidate.citizen.person.name,
          wallet: candidate.citizen.person.wallet,
          votes: candidate.voteCount.toString(),
        });
      }
      setCandidates(list);
      localStorage.setItem("lastCandidates", JSON.stringify(list));
    } catch (e) {
      console.error("Error loading candidates", e);
    }
  }, [contract, publicClient]);

  useEffect(() => {
    if (!contract) return;
    void fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000);
    return () => clearInterval(interval);
  }, [contract, location, fetchCandidates]);

  useEffect(() => {
    if (!contract || !publicClient) return;

    const setupWatchers = async () => {
      const fromBlock = await publicClient.getBlockNumber();
      const address = contract.address as Address;
      const abi = contract.abi as Abi;

      const unwatchCandidate = publicClient.watchContractEvent({
        address,
        abi,
        eventName: "CandidateAdded",
        fromBlock,
        onLogs: () => {
          setTimeout(fetchCandidates, 3000);
        },
      });

      const unwatchVote = publicClient.watchContractEvent({
        address,
        abi,
        eventName: "VoteCast",
        fromBlock,
        onLogs: () => {
          setTimeout(fetchCandidates, 3000);
        },
      });

      return () => {
        unwatchCandidate();
        unwatchVote();
      };
    };

    const cleanupPromise = setupWatchers();
    return () => {
      void cleanupPromise.then((c) => c && c());
    };
  }, [contract, publicClient, fetchCandidates]);

  const filteredCandidates =
    !filterWallets || filterWallets.length === 0
      ? candidates
      : candidates.filter((c) => filterWallets.includes(c.wallet));

  const handleVote = async (wallet: string) => {
    if (!contract || !publicClient) return;
    try {
      const address = contract.address as Address;
      const abi = contract.abi as Abi;

      // getCitizen() -> struct
      const citizenUnknown = await publicClient.readContract({
        address,
        abi,
        functionName: "getCitizen",
        args: [],
      });
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = new Citizen(citizenUnknown);

      if (!citizen.registered) {
        setShowErrorCandidateModal("Primero te tienes que registrar");
        return;
      }
      if (citizen.voted) {
        setShowErrorCandidateModal("Solo puedes votar una vez por elección.");
        return;
      }

      // Escritura: si tu hook NO expone write, migra a useWriteContract(); si sí lo expone, puedes dejarlo:
      // @ts-expect-error "Dynamic ABI import"
      await contract.write.vote({ args: [wallet] });

      setTimeout(fetchCandidates, 100000);
    } catch (e) {
      setShowErrorCandidateModal(String(e));
    }
  };

  return (
    <>
      <main className="page-layout">
        <aside className="chat-container">
          <ChatBox
            onMatchedWallets={(wallets) => {
              setFilterWallets(wallets.length ? wallets : null);
            }}
          />
        </aside>
        <div>
          <h1>Democracy Chain</h1>
          <h2>Candidatos</h2>
          {filterWallets && (
            <button onClick={() => setFilterWallets(null)}>
              Mostrar todos los candidatos
            </button>
          )}
          <div className="table-container">
            {candidates.length === 0 ? (
              <p>No hay candidatos aún.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Nombre</th>
                    <th>Votos</th>
                    <th>Votar</th>
                    <th>Programa</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((c) => (
                    <tr key={c.wallet}>
                      <td>{c.dni}</td>
                      <td>{c.name}</td>
                      <td>{c.votes}</td>
                      <td>
                        <button
                          onClick={() => handleVote(c.wallet)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.5rem",
                          }}
                          title="Votar"
                        >
                          🗳️
                        </button>
                      </td>
                      <td>
                        <Link to={`/viewer?wallet=${encodeURIComponent(c.wallet)}`}>
                          📄
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      {showErrorCandidateModal && (
        <Modal
          title="🗳️ Error"
          message={showErrorCandidateModal}
          onClose={() => setShowErrorCandidateModal("")}
          autoCloseDelay={4000}
        />
      )}
    </>
  );
}

