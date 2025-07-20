import { useState, useEffect } from "react";
import { useDemocracyContract } from '../hooks/useDemocracyContract'

export default function Footer() {
  const contract = useDemocracyContract()
  const [newRegistrationDate, setNewRegistrationDate] = useState("");
  const [newVotingDate, setNewVotingDate] = useState("");

  const loadDates = async () => {
    if (!contract) return

    try {
      const registration = new Date(Number(await contract.read.registrationDeadline() as bigint))
      const voting = new Date(Number(await contract.read.votingDeadline() as bigint))
      setNewRegistrationDate(registration.toLocaleDateString())
      setNewVotingDate(voting.toLocaleDateString())
    } catch (e) {
      console.log("No existe", e)
    }
  }

  useEffect(() => {
    loadDates();
  }, []);

  return (
    <>
      <footer className="footer" >
        <div>📅 inscripcion: {newRegistrationDate}</div>  <div>📅 votacion: {newVotingDate}</div>
      </footer>
    </>
  );
}


