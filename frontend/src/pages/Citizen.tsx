import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract, Citizen, Candidate } from '../hooks/useDemocracyContract'
import { usePublicClient, useAccount } from "wagmi";
import { toast } from 'react-toastify';
import { decodeEventLog } from 'viem';

export default function CitizenPage() {
  const { address: connectedAddress } = useAccount();
  const contract = useDemocracyContract()
  const [newDni, setNewDni] = useState("");
  const [newName, setNewName] = useState("");
  const [newCandidate, setNewCandidate] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isDisabledAll, setIsDisabledAll] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const [hasProgram, setHasProgram] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const publicClient = usePublicClient();


  const handleAddCitizen = async () => {
    if (!newDni || !newName || !contract || !publicClient) return;
    setIsDisabledAll(true);
    try {
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = new Citizen(await contract.read.getCitizen([]))
      let hash = null
      if (!citizen.registered) {
        if (newCandidate) {
          // @ts-expect-error "Dynamic ABI import"
          hash = await contract.write.addCitizenCandidate([newDni, newName])
        } else {
          // @ts-expect-error "Dynamic ABI import"
          hash = await contract.write.registerCitizen([newDni, newName]);
        }
      } else {
        if (newCandidate) {
          // @ts-expect-error "Dynamic ABI import"
          hash = await contract.write.addCandidate([]);
        }
      }
    } catch (e) {
      console.log("Error:", e)
    }
  };

  const loadCitizen = useCallback(async () => {
    if (!contract || !publicClient) return

    try {
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = new Citizen(await contract.read.getCitizen())
      if (citizen.registered) {
        setIsRegistered(true);
        setNewDni(citizen.person.dni)
        setNewName(citizen.person.name)
        setIsDisabled(true)
        setIsDisabledAll(false);
        // @ts-expect-error "Dynamic ABI import"
        const candidate: Candidate = new Candidate(await contract.read.getCandidate([citizen.person.dni]))
        setIsCandidate(candidate.citizen.person.wallet === citizen.person.wallet)
        setNewCandidate(candidate.citizen.person.wallet === citizen.person.wallet)
        const res = await fetch(`${BACKEND_URL}/${candidate.citizen.person.wallet}/program`)
        setHasProgram(res.ok);
      }
    } catch (e) {
      console.log("No existe", e)
    }
  }, [contract])



  useEffect(() => {
    if (!contract || !publicClient || !connectedAddress) return;

    loadCitizen(); // Primera carga

    const setupWatchers = async () => {
      const fromBlock = await publicClient.getBlockNumber();

      const handleLogs = (expectedEvent: 'CitizenRegistered' | 'CandidateAdded') =>
        (logs: any[]) => {
          logs.forEach((log, i) => {
            try {
              const decoded = decodeEventLog({
                abi: contract.abi,
                data: log.data,
                topics: log.topics,
              });

              if (
                decoded.eventName === expectedEvent &&
                decoded.args?.wallet?.toLowerCase() === connectedAddress.toLowerCase()
              ) {
                console.log(`✅ ${expectedEvent} filtrado para ${connectedAddress}`);
                toast.success(
                  expectedEvent === 'CitizenRegistered'
                    ? '🧑‍💼 Ciudadano registrado con éxito'
                    : '🎯 Candidato registrado con éxito',
                  { position: "bottom-right" }
                );
                setTimeout(() => {
                  loadCitizen();
                }, 3000);
              }
            } catch (err) {
              console.warn(`❌ No se pudo decodificar el log ${i}:`, err);
              toast.error("❌ Error al registrar ciudadano", {
                position: "bottom-right",
              });
            }
          });
        };

      const unwatchCitizen = (publicClient as any).watchEvent({
        address: contract.address,
        fromBlock,
        onLogs: handleLogs('CitizenRegistered'),
      });

      const unwatchCandidate = (publicClient as any).watchEvent({
        address: contract.address,
        fromBlock,
        onLogs: handleLogs('CandidateAdded'),
      });

      return () => {
        unwatchCitizen();
        unwatchCandidate();
      };
    };

    const cleanupPromise = setupWatchers();

    return () => {
      cleanupPromise.then((cleanup) => {
        cleanup?.();
      });
    };
  }, [contract, publicClient, connectedAddress, loadCitizen]);

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
              disabled={isDisabled || isDisabledAll}
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
              disabled={isDisabled || isDisabledAll}
            />
          </div>

          <div className="form-row">
            <label htmlFor="is_candidate">Candidato</label>
            <input
              type="checkbox"
              id="is_candidate"
              checked={newCandidate}
              disabled={isDisabledAll}
              onChange={() => { setNewCandidate(!newCandidate); }}
              required
            />
          </div>
          <div className="form-button-container">
            {!isRegistered || !isCandidate ? (
              <button
                onClick={handleAddCitizen}
                disabled={isDisabledAll}
                className="styled">
                Guardar
              </button>
            ) : (
              (hasProgram ? (
                <a href="/editor">
                  <button
                    disabled={isDisabledAll}
                    className="styled">
                    Editar Programa
                  </button>
                </a>
              ) : (
                <a href="/editor">
                  <button
                    disabled={isDisabledAll}
                    className="styled">
                    Crear Programa
                  </button>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div >
  </main >)
}
