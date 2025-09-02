import { useState, useEffect, useCallback, useRef } from "react";
import {
  useDemocracyContract,
  Citizen,
  Candidate,
} from "../hooks/useDemocracyContract";
import { usePublicClient, useAccount } from "wagmi";
import { toast } from "react-toastify";
import type { Address, Abi } from "viem";

export default function CitizenPage() {
  const { address: connectedAddress } = useAccount();
  const contract = useDemocracyContract();

  const [newDni, setNewDni] = useState("");
  const [newName, setNewName] = useState("");
  const [newCandidate, setNewCandidate] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isDisabledAll, setIsDisabledAll] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const [hasProgram, setHasProgram] = useState(false);

  const BACKEND_URL = import.meta.env["VITE_BACKEND_URL"];
  // Si conoces tu chainId (p. ej., Hardhat: 31337), puedes fijarlo:
  const publicClient = usePublicClient({ chainId: 31337 })!;

  // En navegador es mejor este tipo que NodeJS.Timeout
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAddress = (v: unknown): v is Address =>
    typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v);

  const handleAddCitizen = async () => {
    if (!newDni || !newName || !contract || !publicClient) return;
    setIsDisabledAll(true);
    try {
      const citizen: Citizen = new Citizen(
        // @ts-expect-error "Dynamic ABI import"
        await contract.read.getCitizen([]),
      );
      if (!citizen.registered) {
        if (newCandidate) {
          // @ts-expect-error "Dynamic ABI import"
          await contract.write.addCitizenCandidate([newDni, newName]);
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
    } catch (e) {
      console.log("Error:", e);
    } finally {
      setIsDisabledAll(false);
    }
  };

  const loadCitizen = useCallback(async () => {
    if (retryRef.current) clearTimeout(retryRef.current);
    if (!contract || !publicClient) return;

    try {
      const caddr = contract.address as Address;
      const cabi = contract.abi as Abi;

      // getCitizen()
      const citizenRaw = await publicClient.readContract({
        address: caddr,
        abi: cabi,
        functionName: "getCitizen",
        args: [], // si no lleva args, puedes omitir args
      });
      // @ts-expect-error "Dynamic ABI import"
      const citizen: Citizen = new Citizen(citizenRaw);

      if (citizen.registered) {
        setIsRegistered(true);
        setNewDni(citizen.person.dni);
        setNewName(citizen.person.name);
        setIsDisabled(true);
        setIsDisabledAll(false);

        // candidates(dni)
        const candidateRaw = await publicClient.readContract({
          address: caddr,
          abi: cabi,
          functionName: "candidates",
          args: [citizen.person.wallet],
        });
        // @ts-expect-error "Dynamic ABI import"
        const candidate: Candidate = new Candidate(candidateRaw);

        const candidateCreated =
          candidate.citizen.person.wallet === citizen.person.wallet;
        if (candidateCreated) {
          setIsCandidate(candidateCreated);
          setNewCandidate(candidateCreated);
          const res = await fetch(
            `${BACKEND_URL}/${candidate.citizen.person.wallet}/program`,
          );
          setHasProgram(res.ok);
        } else if (newCandidate) {
          retryRef.current = setTimeout(() => {
            void loadCitizen();
          }, 1000);
        }
      } else {
        retryRef.current = setTimeout(() => {
          void loadCitizen();
        }, 1000);
      }
    } catch (e) {
      console.log("No existe", e);
    }
  }, [contract, publicClient, BACKEND_URL, newCandidate]);

  useEffect(() => {
    if (!contract || !publicClient || !connectedAddress) return;

    void loadCitizen(); // Primera carga

    const setupWatchers = async () => {
      const fromBlock = await publicClient.getBlockNumber();

      // CitizenRegistered
      const unwatchCitizen = publicClient.watchContractEvent({
        address: contract.address as Address,
        abi: contract.abi,
        eventName: "CitizenRegistered",
        fromBlock,
        onLogs: (logs) => {
          for (const log of logs) {
            const args = (log as { args?: Record<string, unknown> })
              .args!;
            const wallet = args["wallet"];
            if (
              isAddress(wallet) &&
              isAddress(connectedAddress) &&
              wallet.toLowerCase() === connectedAddress.toLowerCase()
            ) {
              toast.success("🧑‍💼 Ciudadano registrado con éxito", {
                position: "bottom-right",
              });
              setTimeout(() => void loadCitizen(), 3000);
            }
          }
        },
      });

      // CandidateAdded
      const unwatchCandidate = publicClient.watchContractEvent({
        address: contract.address as Address,
        abi: contract.abi,
        eventName: "CandidateAdded",
        fromBlock,
        onLogs: (logs) => {
          for (const log of logs) {
            const args = (log as { args?: Record<string, unknown> })
              .args!;
            const wallet = args["wallet"];
            if (
              isAddress(wallet) &&
              isAddress(connectedAddress) &&
              wallet.toLowerCase() === connectedAddress.toLowerCase()
            ) {
              toast.success("🎯 Candidato registrado con éxito", {
                position: "bottom-right",
              });
              setTimeout(() => void loadCitizen(), 3000);
            }
          }
        },
      });

      return () => {
        unwatchCitizen();
        unwatchCandidate();
      };
    };

    const cleanupPromise = setupWatchers();
    return () => {
      void cleanupPromise.then((cleanup) => {
        cleanup?.();
      });
    };
  }, [contract, publicClient, connectedAddress, loadCitizen]);

  return (
    <main>
      <div>
        <img src="/freedom.svg" alt="Freedom" />
        <div>
          <h1>Democracy Chain</h1>
          <h2>Añadir Ciudadano</h2>

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
                onChange={() => {
                  setNewCandidate(!newCandidate);
                }}
                required
              />
            </div>

            <div className="form-button-container">
              {!isRegistered || !isCandidate ? (
                <button
                  onClick={handleAddCitizen}
                  disabled={isDisabledAll}
                  className="styled"
                >
                  Guardar
                </button>
              ) : hasProgram ? (
                <a href="/citizen/editor">
                  <button disabled={isDisabledAll} className="styled">
                    Editar Programa
                  </button>
                </a>
              ) : (
                <a href="/citizen/editor">
                  <button disabled={isDisabledAll} className="styled">
                    Crear Programa
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
