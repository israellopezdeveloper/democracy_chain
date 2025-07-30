const { ethers } = require("ethers");

const fs = require("fs");
const path = require("path");

async function main() {
  const [, , founderPk, dni, name] = process.argv;

  if (!founderPk || !dni || !name) {
    console.error(
      "❌ Usage: node register-candidate.js <founderPrivateKey> <dni> <name>"
    );
    process.exit(1);
  }

  const RPC_URL = "http://localhost:8545";
  const FUNDING_AMOUNT_ETH = "1.0";
  const CONTRACT_ADDRESS = ethers.getAddress(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  const abiPath = path.resolve(
    __dirname,
    "../dapp/artifacts/contracts/DemocracyChain.sol/DemocracyChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const abi = artifact.abi;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const funder = new ethers.Wallet(founderPk, provider);

  const newWallet = ethers.Wallet.createRandom();

  const txFund = await funder.sendTransaction({
    to: newWallet.address,
    value: ethers.parseEther(FUNDING_AMOUNT_ETH),
  });
  await txFund.wait();

  const connectedWallet = newWallet.connect(provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, connectedWallet);

  const tx = await contract.addCitizenCandidate(dni, name);
  await tx.wait();

  // 🧾 Imprimir JSON parseable para bash
  console.log(
    JSON.stringify({
      wallet: newWallet.address,
      private_key: newWallet.privateKey,
    })
  );
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
