import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract, Candidate, Citizen } from '../hooks/useDemocracyContract'
import { Modal } from "../components/Modal";

interface CandidateItem {
  dni: string;
  name: string;
  votes: bigint;
}

export default function CandidatesPage() {
  const contract = useDemocracyContract()
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [showErrorCandidateModal, setShowErrorCandidateModal] = useState(false);

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
          dni: candidate.citizen.person.dni, name: candidate.citizen.person.name, votes: candidate.voteCount
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

  useEffect(() => {
    if (!contract) return;
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000); // cada 10s
    return () => clearInterval(interval);
  }, [contract, fetchCandidates]);


  return (
    <>
      <main>
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

