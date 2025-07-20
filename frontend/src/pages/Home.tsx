// import { useWalletClient } from "wagmi";
// import { getContract } from "../contracts/democracy_chain";
// import { ethers } from "ethers";
// import { CONTRACT_ADDRESS } from "../config";
// import { solidityPackedKeccak256 } from 'ethers'

export default function Home() {
  // const { data: walletClient } = useWalletClient();

  // async function clickButton1() {
  //   if (!walletClient) return;
  //   const provider = new ethers.BrowserProvider(walletClient);
  //   const signer = await provider.getSigner();
  //   const contract = getContract(CONTRACT_ADDRESS, signer);
  //   const registrationDeadline = Number(await contract.registrationDeadline());
  //   const votingDeadline = Number(await contract.votingDeadline());
  //   console.log("Registration Deadline = ", new Date(registrationDeadline),
  //     "\nVote Deadline         = ", new Date(votingDeadline))
  // }
  //
  // async function clickButton2() {
  //   if (!walletClient) return;
  //   const provider = new ethers.BrowserProvider(walletClient);
  //   const signer = await provider.getSigner();
  //   const contract = getContract(CONTRACT_ADDRESS, signer);
  //   try {
  //     await contract.registerCitizen("51103142V", "Israel Lopez", "0x95FeEa2C2c4FCa588faB44808e82a5fC53Ca4823");
  //   } catch (e) {
  //     console.log('Ya esta registrado')
  //   }
  //   const hashDni = solidityPackedKeccak256(['string'], ["51103142V"])
  //   let wallet = '0x0000000000000000000000000000000000000000'
  //   let citizen;
  //   while (wallet === '0x0000000000000000000000000000000000000000') {
  //     citizen = await contract.citizens(hashDni);
  //     wallet = citizen.person.wallet
  //   }
  //   console.log("Citizen -> ", citizen.person.name)
  //   console.log("Citizen -> ", citizen.person.dni)
  //   console.log("Citizen -> ", citizen.person.wallet)
  //   console.log("Citizen -> ", citizen.registered)
  //   console.log("Citizen -> ", citizen.voted)
  // }

  // async function clickButton3() {
  //   if (!walletClient) return;
  //   const provider = new ethers.BrowserProvider(walletClient);
  //   const signer = await provider.getSigner();
  //   const contract = getContract(CONTRACT_ADDRESS, signer);
  //   const count = await contract.admin();
  //   console.log("Admin? [", await signer.getAddress(), "] -> ", count)
  // }
  //
  // async function clickButton4() {
  //   if (!walletClient) return;
  //   const provider = new ethers.BrowserProvider(walletClient);
  //   const signer = await provider.getSigner();
  //   const contract = getContract(CONTRACT_ADDRESS, signer);
  //   await contract.addCandidate("51103142V", "El puto amo");
  //   console.log("Add candidate? [", await signer.getAddress(), "] -> OK")
  // }
  //
  // async function clickButton5() {
  //   if (!walletClient) return;
  //   const provider = new ethers.BrowserProvider(walletClient);
  //   const signer = await provider.getSigner();
  //   const contract = getContract(CONTRACT_ADDRESS, signer);
  //   const count = await contract.candidateList(0);
  //   console.log("Get DNI? -> ", count)
  // }
  //
  // async function clickButton6() {
  //   if (!walletClient) return;
  //   const provider = new ethers.BrowserProvider(walletClient);
  //   const signer = await provider.getSigner();
  //   const contract = getContract(CONTRACT_ADDRESS, signer);
  //   const dni = await contract.candidateList(0);
  //   const [name, votes] = await contract.getCandidate(dni);
  //   console.log("Get DNI? -> (", dni, name, votes, ")")
  // }

  return (
    <main>
      <div>
        <img
          src="/freedom.svg"
          alt="Freedom"
        />
        <div>
          <h1>
            DemocracyChain
          </h1>
          <p>
            Libertad para elegir. Transparencia para confiar. Construye una democracia auténtica en la blockchain.
          </p>
        </div>
      </div>
    </main >
  );
}

