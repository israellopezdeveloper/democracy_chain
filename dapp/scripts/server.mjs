import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

const CONTRACT_PATH = path.resolve(
  "artifacts/contracts/DemocracyChain.sol/DemocracyChain.json"
);

app.get("/abi", (_, res) => {
  if (!fs.existsSync(CONTRACT_PATH)) {
    return res.status(404).json({ error: "ABI not available yet" });
  }

  try {
    const abi = JSON.parse(
      fs.readFileSync(CONTRACT_PATH, "utf-8")
    ).abi;
    res.json(abi);
  } catch (err) {
    console.error("❌ Error reading ABI:", err);
    res.status(500).json({ error: "Failed to read ABI" });
  }
});

app.get("/address", (_, res) => {
  const ADDRESS_PATH = path.resolve("deployed-address.json"); // lo escribes desde deploy
  if (fs.existsSync(ADDRESS_PATH)) {
    const { address, network } = JSON.parse(
      fs.readFileSync(ADDRESS_PATH, "utf-8")
    );
    res.json({ address, network });
  } else {
    res.status(404).json({ error: "Address not available yet" });
  }
});

app.listen(3000, () => {
  console.log("🔌 Contract server listening on port 3000");
});
