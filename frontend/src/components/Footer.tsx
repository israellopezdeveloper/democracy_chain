import { useState, useEffect, useCallback } from "react";
import { useDemocracyContract } from '../hooks/useDemocracyContract'

export default function Footer() {
  const contract = useDemocracyContract();

  const [newRegistrationDate, setNewRegistrationDate] = useState("");
  const [newVotingDate, setNewVotingDate] = useState("");

  const loadDates = useCallback(async () => {
    if (!contract) return

    try {
      // @ts-expect-error "Dynamic ABI import"
      const registration = new Date(Number((await contract.read.REGISTRATION_DEADLINE([])) as bigint))
      // @ts-expect-error "Dynamic ABI import"
      const voting = new Date(Number(await contract.read.VOTING_DEADLINE([]) as bigint))
      setNewRegistrationDate(registration.toLocaleDateString())
      setNewVotingDate(voting.toLocaleDateString())
    } catch (e) {
      console.log("No existe", e)
    }
  }, [contract])

  useEffect(() => {
    loadDates();
  }, [contract, loadDates]);

  return (
    <>
      <footer className="footer" >
        <div>📅 Inscripción: {newRegistrationDate}</div>  <div>📅 Votación: {newVotingDate}</div>
      </footer>
    </>
  );
}


