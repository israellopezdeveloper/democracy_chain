# TODO

## ✅ Soulbound Token to Prevent Multiple Voting

### **Idea:**

Issue a Soulbound Token (non-transferable NFT) to each citizen who has
passed an off-chain identity verification process (e.g., via Spanish
digital certificate). Only wallets holding this Soulbound Token will
be allowed to vote in the DemocracyChain contract.

### 🎯 **Motivation**

- Prevent a person from voting with multiple wallets.
- Preserve privacy: no storage of personal data or ID numbers
  on-chain.
- Keep the on-chain process fully decentralized without exposing
  sensitive information.
- Easily integrate with official e-identification systems (e.g., FNMT
  certificate).
- Use well-known standards (ERC721) for a simple and secure
  implementation.

### ⚙️ **Execution Steps**

✅ **Step 1 — Develop a Soulbound Token Contract:**

- Create an ERC721 and override the `transfer` function to disable
  token transfer.
- Implement a `mintSoulbound(address to)` function callable only by
  the verification backend.

✅ **Step 2 — Modify DemocracyChain:**

- Add a reference to the Soulbound Token contract (store its address).
- Add a `require` inside `vote()` to check:

  ```solidity
  require(soulboundToken.balanceOf(msg.sender) > 0, "Not verified citizen");
  ```

✅ **Step 3 — Build the Verification Backend:**

- Integrate off-chain verification via digital certificate or other
  identity method.
- If identity is verified, call `mintSoulbound` to issue the token to
  the citizen's wallet.

✅ **Step 4 — Issue Soulbound Token after Verification:**

- Optionally store ID hashes in backend to prevent duplicate
  verifications.
- Notify the citizen that their wallet is now authorized to vote.

✅ **Step 5 — Update the Frontend:**

- Add verification flow to the DApp.
- Show whether the wallet holds the Soulbound Token.
- Enable voting only for verified wallets.

✅ **Step 6 — Testing:**

- Test smart contracts with:
  - Wallet with token → can vote.
  - Wallet without token → cannot vote.

- Ensure token transfer attempts fail.

---

Semantic Search for Electoral Programs

## 🎯 **Motivation**

Any citizen can become a candidate, which is positive for democratic
participation. However, this may lead to **a large number of
candidates**, making it difficult for voters to make informed
decisions.

The solution is to build an **intelligent search engine**, where
voters can describe the kind of proposals or values they seek, and get
the **10 most aligned candidates** based on their electoral programs.

This encourages informed voting and reduces political “infobesity.”

## 💡 **Proposal**

- Each candidate uploads their **electoral program** (full text) to a
  backend.
- The backend stores:
  - Full text (e.g., in a database).
  - **Hash of the program** on the blockchain to guarantee
    immutability and transparency.

- Programs are indexed in **Elasticsearch** using local **SBERT**
  embeddings.
- Voters can enter natural language queries.
- Elasticsearch returns the 10 most semantically similar programs.
- Optionally: expose this functionality via REST API or frontend.

## ⚙️ **Execution Steps**

✅ **Step 1 — Set Up Local Environment**

- Install Elasticsearch OSS or OpenSearch.
- Choose and download an SBERT model (e.g., `all-MiniLM-L6-v2`) from
  Hugging Face.

✅ **Step 2 — Index Electoral Programs**

- Create a Node.js or Python script to:
  - Read each program.
  - Generate its embedding with SBERT.
  - Store the text and embedding in Elasticsearch.

✅ **Step 3 — Create Search Endpoint**

- Build a REST or GraphQL endpoint to:
  - Receive a user's free-text query.
  - Generate an embedding with SBERT.
  - Search for similar vectors in Elasticsearch.
  - Return the top 10 candidates.

✅ **Step 4 — Blockchain Integration**

- Store the hash of the full program on the blockchain (e.g., via a
  mapping in DemocracyChain).
- Let users verify the document against the blockchain record.

✅ **Step 5 — Frontend (Optional)**

- Build a simple search interface.
- Display the top candidates and summaries of their programs.

✅ **Step 6 — Security & Privacy**

- Ensure:
  - Personal data is protected.
  - GDPR compliance if storing candidate data.

✅ **Step 7 — Testing & Quality Metrics**

- Evaluate:
  - Embedding quality.
  - Search latency.
  - Result accuracy.

- Define relevance metrics:
  - Precision\@10
  - Recall
  - Mean Reciprocal Rank (MRR)

## 🔗 **Suggested Tech Stack**

- **Vector DB:** Elasticsearch OSS / OpenSearch
- **Embeddings:** SBERT (local, Hugging Face)
- **Backend:** Node.js, Python, or both
- **Blockchain:** Solidity + DemocracyChain
- **Frontend:** (optional) React, Vue, Svelte, etc.

## 🚀 **Advantages**

- 100% **offline-capable** and free (local SBERT + OSS stack).
- High semantic search accuracy.
- Guaranteed integrity via blockchain.
- Scalable to hundreds of thousands of programs and millions of
  queries.
