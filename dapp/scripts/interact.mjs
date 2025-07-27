import hardhat from "hardhat";
import inquirer from "inquirer";
import crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

const { artifacts } = hardhat;

function checksumAbi(abi) {
  const json = JSON.stringify(abi);
  return crypto.createHash("sha256").update(json).digest("hex");
}

async function interactWithContract(contractName, contract) {
  const artifact = await artifacts.readArtifact(contractName);
  const abi = artifact.abi;
  const abiHash = checksumAbi(abi);

  console.log(`✅ ABI loaded for contract: ${contractName}`);
  console.log(`   ABI SHA256: ${abiHash}`);

  const publicFunctions = abi.filter(
    (item) => item.type === "function" && item.stateMutability !== "view"
  );

  const viewFunctions = abi.filter(
    (item) => item.type === "function" && item.stateMutability === "view"
  );

  if (publicFunctions.length === 0 && viewFunctions.length === 0) {
    console.log("⚠️ This contract has no public or view functions.");
    return;
  }

  while (true) {
    let width = process.stdout.columns - 2;
    let horizontal = "─".repeat(width);
    console.log(`\n╭${horizontal}╮`);
    const choices = [
      ...publicFunctions.map((f) => ({
        name: `Tx - ${f.name}(${f.inputs.map((i) => i.type).join(", ")})`,
        value: { name: f.name, inputs: f.inputs, isTx: true },
      })),
      ...viewFunctions.map((f) => ({
        name: `View - ${f.name}(${f.inputs.map((i) => i.type).join(", ")})`,
        value: { name: f.name, inputs: f.inputs, isTx: false },
      })),
      new inquirer.Separator(),
      { name: "Exit", value: null },
    ];

    const { func } = await inquirer.prompt([
      {
        type: "list",
        name: "func",
        message: "What function do you want to execute?",
        choices,
      },
    ]);

    if (!func) {
      console.log("👋 See you!");
      width = process.stdout.columns - 2;
      horizontal = "─".repeat(width);
      console.log(`╰${horizontal}╯\n`);
      break;
    }

    let args = [];

    for (const input of func.inputs) {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "value",
          message: `Introduce value for ${input.name} (${input.type}):`,
        },
      ]);
      args.push(parseInputValue(answer.value, input.type));
    }

    let overrides = {};

    const artifactFunc = abi.find(
      (f) => f.name === func.name && f.inputs.length === func.inputs.length
    );

    if (
      func.isTx &&
      artifactFunc &&
      artifactFunc.stateMutability === "payable"
    ) {
      const { ethValue } = await inquirer.prompt([
        {
          type: "input",
          name: "ethValue",
          message: "Enter ETH amount to send (or 0):",
          default: "0",
        },
      ]);

      overrides.value = hardhat.ethers.parseEther(ethValue);
    }

    try {
      console.log(`→ Calling function: ${func.name}`);
      console.log(`   Arguments: ${args}`);
      const result = func.isTx
        ? await (await contract[func.name](...args, overrides)).wait()
        : await contract[func.name](...args);
      console.log(
        `✅ Result of ${func.name}:`,
        result?.toString?.() ?? result,
        "\n"
      );
    } catch (error) {
      console.error("❌ Error executing function:\n", error);
    }
    width = process.stdout.columns - 2;
    horizontal = "─".repeat(width);
    console.log(`╰${horizontal}╯\n`);
  }
}

function parseInputValue(value, type) {
  if (type.startsWith("uint") || type.startsWith("int")) {
    return BigInt(value);
  }
  if (type === "address") {
    return value;
  }
  if (type === "string") {
    return value;
  }
  if (type === "bool") {
    return value.toLowerCase() === "true";
  }
  return value;
}

async function main() {
  const network = process.env.NETWORK;
  const contractName = process.env.CONTRACT_NAME;
  const address = process.env.ADDRESS;

  if (!network || !contractName || !address) {
    console.error(
      "❌ Missing env vars. Usage:\n" +
        "NETWORK=... CONTRACT_NAME=... ADDRESS=... npx hardhat run ..."
    );
    process.exit(1);
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    console.error("❌ Contract address is invalid:", address);
    process.exit(1);
  }

  const networkName = hardhat.network.name;
  console.log("✅ Hardhat active network:", networkName);

  let signer;
  let rpcUrl;
  let chainId;

  if (networkName === "localhost" || networkName === "hardhat") {
    const [localSigner] = await hardhat.ethers.getSigners();
    signer = localSigner;
    rpcUrl = process.env.BLOCKCHAIN_URL || "http://127.0.0.1:8545";
    const net = await hardhat.ethers.provider.getNetwork();
    chainId = net.chainId;
  } else {
    if (!process.env.PRIVATE_KEY || !process.env.INFURA_API_KEY) {
      console.error("❌ Missing PRIVATE_KEY or API_KEY in .env file.");
      process.exit(1);
    }
    rpcUrl = `https://${networkName}.infura.io/v3/${process.env.INFURA_API_KEY}`;
    const provider = new hardhat.ethers.JsonRpcProvider(rpcUrl);
    signer = new hardhat.ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const net = await provider.getNetwork();
    chainId = net.chainId;
  }

  const signerAddress =
    typeof signer.getAddress === "function"
      ? await signer.getAddress()
      : signer.address;

  console.log(`✅ RPC URL: ${rpcUrl}`);
  console.log(`✅ Signer address: ${signerAddress}`);
  console.log(`✅ ChainId: ${chainId}`);
  console.log(`✅ Contract address: ${address}`);

  const contract = await hardhat.ethers.getContractAt(
    contractName,
    address,
    signer
  );

  console.log(`✅ Contract instance loaded.`);

  await interactWithContract(contractName, contract);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
