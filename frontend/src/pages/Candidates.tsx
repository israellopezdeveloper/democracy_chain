import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract, Candidate, Citizen } from '../hooks/useDemocracyContract'
import { Modal } from "../components/Modal";
import { useLocation, Link } from 'react-router-dom';
import { decodeEventLog } from 'viem';
import { usePublicClient } from 'wagmi';
import ChatBox from "../components/ChatBox";

interface CandidateItem {
  dni: string;
  name: string;
  wallet: string;
  votes: string; // Cambiado de bigint a string para serializar
}

export default function CandidatesPage() {
  const contract = useDemocracyContract();
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [showErrorCandidateModal, setShowErrorCandidateModal] = useState("");
  const [filterWallets, setFilterWallets] = useState<string[] | null>(null);
  const publicClient = usePublicClient();
  const location = useLocation();

  // Cargar últimos candidatos desde localStorage
  useEffect(() => {
    const savedCandidates = localStorage.getItem('lastCandidates');
    if (savedCandidates) {
      try {
        const parsed = JSON.parse(savedCandidates);
        setCandidates(parsed);
      } catch (e) {
        console.warn("No se pudieron cargar los candidatos desde localStorage.", e);
      }
    }
    const savedFilter = localStorage.getItem('filterWallets');
    if (savedFilter) {
      setFilterWallets(JSON.parse(savedFilter));
    }
  }, []);

  // Persistir filterWallets
  useEffect(() => {
    if (filterWallets && filterWallets.length > 0) {
      localStorage.setItem('filterWallets', JSON.stringify(filterWallets));
    } else {
      localStorage.removeItem('filterWallets');
    }
  }, [filterWallets]);

  const fetchCandidates = useCallback(async () => {
    if (!contract) return;
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
          votes: candidate.voteCount.toString(), // Convertir a string para localStorage
        });
      }
      setCandidates(list);
      localStorage.setItem('lastCandidates', JSON.stringify(list));
    } catch (e) {
      console.error("Error loading candidates", e);
    }
  }, [contract]);

  useEffect(() => {
    if (!contract) return;
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000);
    return () => clearInterval(interval);
  }, [contract, location, fetchCandidates]);

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
                setTimeout(fetchCandidates, 3000);
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
        onLogs: handleLogs('VoteCast'),
      });
      return () => {
        unwatchCandidate();
        unwatchVote();
      };
    };
    const cleanupPromise = setupWatchers();
    return () => {
      cleanupPromise.then(c => c && c());
    };
  }, [contract, publicClient, fetchCandidates]);

  const filteredCandidates = !filterWallets || filterWallets.length === 0
    ? candidates
    : candidates.filter(c => filterWallets.includes(c.wallet));

  const handleVote = async (wallet: string) => {
    if (!contract) return;
    try {
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = await contract.read.getCitizen([]);
      if (!citizen.registered) {
        setShowErrorCandidateModal("Primero te tienes que registrar");
        return;
      }
      if (citizen.voted) {
        setShowErrorCandidateModal("Solo puedes votar una vez por elección.");
        return;
      }
      // @ts-expect-error "Dynamic ABI import"
      await contract.write.vote({ args: [wallet] });
      setTimeout(fetchCandidates, 100000);
    } catch (e) {
      setShowErrorCandidateModal(e as string);
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
                  {filteredCandidates.map(c => (
                    <tr key={c.wallet}>
                      <td>{c.dni}</td>
                      <td>{c.name}</td>
                      <td>{c.votes}</td>
                      <td>
                        <button
                          onClick={() => handleVote(c.dni)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
                          title="Votar"
                        >🗳️</button>
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

