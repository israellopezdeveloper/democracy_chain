import { useState, useEffect } from "react";
import { useDemocracyContract, Candidate } from '../hooks/useDemocracyContract'

interface CandidateItem {
  dni: string;
  name: string;
  votes: bigint;
}

export default function CandidatesPage() {
  const contract = useDemocracyContract()
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);

  const fetchCandidates = async () => {
    if (!contract) return

    try {
      const count: bigint = await contract.read.getCandidateCount([]) as bigint
      const list: CandidateItem[] = [];
      for (let i = 0; i < count; i++) {
        const candidate: Candidate = new Candidate(await contract.read.getCandidateByIndex([i]));
        list.push({
          dni: candidate.citizen.person.dni, name: candidate.citizen.person.name, votes: candidate.voteCount
        })
      }
      setCandidates(list);
    } catch (e) {
      console.error("Error loading candidates", e);
    }
  };

  const handleVote = async (wallet: string) => {
    console.log("Votando por candidato con wallet:", wallet);

    if (!contract) return;

    try {
      await contract.write.vote({
        args: [wallet],
      });
      setTimeout(async () => { await fetchCandidates(); }, 1000000);
    } catch (error) {
      console.error("Error al votar:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [contract]);

  return (<main>
    <div>
      <img
        src="/freedom.svg"
        alt="Freedom"
      />
      <div>
        <h1>
          DemocracyChain
        </h1>

        <h2>
          Candidatos
        </h2>

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
                    <tr key={c.dni} >
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
                            fontSize: "1.5rem"
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
  );
}

