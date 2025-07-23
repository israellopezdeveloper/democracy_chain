import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract, Citizen, Candidate } from '../hooks/useDemocracyContract'

export default function CitizenPage() {
  const contract = useDemocracyContract()
  const [newDni, setNewDni] = useState("");
  const [newName, setNewName] = useState("");
  const [newCandidate, setNewCandidate] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isCandidateRegistered, setIsCandidateRegistered] = useState(false);


  const handleAddCitizen = async () => {
    if (!newDni || !newName || !contract) return;
    try {
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = new Citizen(await contract.read.getCitizen())
      if (citizen.person.wallet === '0x0000000000000000000000000000000000000000') {
        if (newCandidate) {
          // @ts-expect-error "Dynamic ABI import"
          await contract.write.addCitizenCandidate([newDni, newName])
        } else {
          // @ts-expect-error "Dynamic ABI import"
          await contract.write.registerCitizen([newDni, newName]);
        }
      } else {
        if (newCandidate) {
          // @ts-expect-error "Dynamic ABI import"
          await contract.write.addCandidate([]);
        }
      }
      setIsDisabled(true)
    } catch (e) {
      console.log("Error:", e)
    }
  };

  const loadCitizen = useCallback(async () => {
    if (!contract) return

    try {
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = new Citizen(await contract.read.getCitizen())
      if (citizen.person.wallet !== '0x0000000000000000000000000000000000000000') {
        setNewDni(citizen.person.dni)
        setNewName(citizen.person.name)
        setIsDisabled(true)
        // @ts-expect-error "Dynamic ABI import"
        const candidate: Candidate = new Candidate(await contract.read.getCandidate([citizen.person.dni]))
        setNewCandidate(candidate.citizen.person.wallet !== '0x0000000000000000000000000000000000000000')
        if (candidate.citizen.person.wallet !== '0x0000000000000000000000000000000000000000') {
          setIsCandidateRegistered(true);
        }

      }
    } catch (e) {
      console.log("No existe", e)
    }
  }, [contract])

  useEffect(() => {
    loadCitizen();
  }, [contract, loadCitizen]);


  return (<main>
    <div>
      <img
        src="/freedom.svg"
        alt="Freedom"
      />
      <div>
        <h1>
          Democracy Chain
        </h1>

        <h2>
          Añadir Ciudadano
        </h2>

        <div className="form-container">
          <div className="form-row">
            <label htmlFor="dni">DNI</label>
            <input
              type="text"
              id="dni"
              value={newDni}
              onChange={(e) => setNewDni(e.target.value)}
              required
              disabled={isDisabled}
            />
          </div>

          <div className="form-row">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              disabled={isDisabled}
            />
          </div>

          <div className="form-row">
            <label htmlFor="is_candidate">Candidato</label>
            <input
              type="checkbox"
              id="is_candidate"
              value="true"
              checked={newCandidate}
              onChange={(e) => setNewCandidate(e.target.value === "true")}
              required
            />
          </div>
          <div className="form-button-container">
            {!isCandidateRegistered ? (
              <button onClick={handleAddCitizen}>
                Guardar
              </button>
            ) : (
              <a href="/editor">
                <button>
                  Crear Programa
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  </main>)
}
