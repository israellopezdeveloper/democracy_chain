# 🗳️ Democracy Chain

**Democracy Chain** is a decentralized application (dApp) designed to bring transparency to democratic voting using blockchain technology. It consists of a smart contract backend with a modern frontend and extensive testing/deployment tooling.

---

## 📦 Project Structure

```
democracy_chain/
├── dapp/               # Smart contract project (Hardhat, Solidity, tests)
├── frontend/           # Frontend app (Vite + React + TypeScript)
├── .github/            # CI/CD GitHub Actions
├── commands.txt        # Dev command references
├── TODO.md             # Project notes and tasks
```

---

## ⚙️ Technologies Used

### Smart Contracts (dapp/)

- **Solidity** (contracts)
- **Hardhat** (development & testing)
- **Typechain** (TypeScript bindings)
- **Solhint** (linter)
- **Coverage** (code coverage)

### Frontend (frontend/)

- **React + Vite + TypeScript**
- **Ethers.js** for interacting with smart contracts
- **Custom Hooks**: `useDemocracyContract`, `useParallax`
- **ESLint + TSConfig** for linting and typing

### DevOps

- **GitHub Actions** for CI
- **Deployment scripts** using Hardhat Ignition

---

## 🚀 How to Run

### 1. Clone & Install

```bash
git clone --recurse-submodules <repo-url>
cd democracy_chain
```

### 2. Setup Backend (dapp)

```bash
cd dapp
npm install
npx hardhat test
```

### 3. Deploy Contracts Locally

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Run Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## ✅ Testing

- **Unit Tests** in `dapp/test/unit/`
- **Staging Tests** in `dapp/test/staging/`
- Run tests with:

```bash
cd dapp
npx hardhat test
```

---

## 📄 TODO

See [`TODO.md`](TODO.md) for pending features and ideas like vote auditing, user roles, and backend indexing.

---

## 🧠 Motivation

This project aims to make democratic voting more transparent and verifiable using smart contracts, so results can be audited and trusted by all participants.

---
