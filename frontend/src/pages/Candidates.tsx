import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract, Candidate, Citizen } from '../hooks/useDemocracyContract'
import { Modal } from "../components/Modal";
import { useLocation } from 'react-router-dom';
import { decodeEventLog } from 'viem';
import { usePublicClient } from 'wagmi';
import ChatBox from "../components/ChatBox";


interface CandidateItem {
  dni: string;
  name: string;
  wallet: string;
  votes: bigint;
}

export default function CandidatesPage() {
  const contract = useDemocracyContract()
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [showErrorCandidateModal, setShowErrorCandidateModal] = useState(false);
  const publicClient = usePublicClient();


  const fetchCandidates = useCallback(async () => {
    if (!contract) return

    try {
      // @ts-expect-error "Dynamic ABI import"
      const count: bigint = await contract.read.getCandidateCount([]) as bigint;
      const list: CandidateItem[] = [];
      for (let i = 0; i < count; i++) {
        // @ts-expect-error "Dynamic ABI import"
        const candidate: Candidate = new Candidate(await contract.read.getCandidateByIndex([i]));
        list.push({
          dni: candidate.citizen.person.dni,
          name: candidate.citizen.person.name,
          wallet: candidate.citizen.person.wallet,
          votes: candidate.voteCount,
        })
      }
      setCandidates(list);
    } catch (e) {
      console.error("Error loading candidates", e);
    }
  }, [contract]);

  const handleVote = async (wallet: string) => {
    if (!contract) return;

    try {
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = await contract.read.getCitizen([]);
      if (citizen.voted) {
        setShowErrorCandidateModal(true); // ✅ Mostrar modal
        return;
      }
      // @ts-expect-error "Dynamic ABI import"
      await contract.write.vote({
        args: [wallet],
      });
      setTimeout(async () => { await fetchCandidates(); }, 100000);
    } catch (e) {
      console.error("Error al votar:", e);
      setShowErrorCandidateModal(true); // ✅ Mostrar modal
    }
  };

  const location = useLocation();
  useEffect(() => {
    if (!contract) return;
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000); // cada 10s
    return () => clearInterval(interval);
  }, [contract, location]);

  useEffect(() => {
    if (!contract || !publicClient) return;

    const setupWatchers = async () => {
      const fromBlock = await publicClient.getBlockNumber();

      const handleLogs = (expectedEvent: 'CandidateAdded' | 'VoteCast') =>
        (logs: any[]) => {
          logs.forEach((log, i) => {
            try {
              const decoded = decodeEventLog({
                abi: contract.abi,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === expectedEvent) {
                console.log(`✅ Evento ${expectedEvent} recibido:`, decoded.args);
                // Dejamos respirar la red antes de leer
                setTimeout(() => {
                  fetchCandidates();
                }, 3000);
              }
            } catch (err) {
              console.warn(`❌ No se pudo decodificar el log ${i}:`, err);
            }
          });
        };

      const unwatchCandidate = (publicClient as any).watchEvent({
        address: contract.address,
        fromBlock,
        onLogs: handleLogs('CandidateAdded'),
      });

      const unwatchVote = (publicClient as any).watchEvent({
        address: contract.address,
        fromBlock,
        onLogs: handleLogs('VoteCast'), // Solo si tu contrato lo emite
      });

      return () => {
        unwatchCandidate();
        unwatchVote();
      };
    };

    const cleanupPromise = setupWatchers();

    return () => {
      cleanupPromise.then((cleanup) => {
        cleanup?.();
      });
    };
  }, [contract, publicClient, fetchCandidates]);

  return (
    <>
      <main className={"page-layout"}>
        <aside className="chat-container">
          <ChatBox />
        </aside>
        <div>
          <img src="/freedom.svg" alt="Freedom" />
          <div>
            <h1>Democracy Chain</h1>
            <h2>Candidatos</h2>

            <div className="table-container">
              {candidates.length === 0 ? (
                <p>No hay candidatos aún.</p>
              ) : (
                <div>
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
                      {candidates.map((c) => (
                        <tr key={c.dni}>
                          <td>{c.dni}</td>
                          <td>{c.name}</td>
                          <td>{c.votes.toString()}</td>
                          <td>
                            <button
                              onClick={() => handleVote(c.dni)}
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
                            <a
                              href={`/viewer?wallet=${encodeURIComponent(c.wallet)}&name=${encodeURIComponent(c.name)}`}
                              rel="noopener noreferrer"
                              title="Ver programa"
                              style={{
                                fontSize: "1.2rem",
                                textDecoration: "none",
                              }}
                            >
                              📄
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {showErrorCandidateModal && (
        <Modal
          title="🗳️ Ya has votado"
          message="Solo puedes votar una vez por elección."
          onClose={() => setShowErrorCandidateModal(false)}
          autoCloseDelay={4000}
        />
      )}
    </>
  );
}

