# SuiRaffle 🎟️💧

[![Sui](https://img.shields.io/badge/Sui-Network-blue?style=for-the-badge&logo=sui)](https://sui.io/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)

**SuiRaffle** is a fully decentralized application (dApp) built on the **Sui Network**. It facilitates the creation and participation of raffles transparently, fairly, and automatically on-chain.

🔗 **Live Demo:** [https://suiraffle.vercel.app/](https://suiraffle.vercel.app/)

---

## 📖 Project Overview

SuiRaffle allows users to seamlessly create their own custom raffle pools or participate in existing ones. By leveraging the advanced architecture of Sui Move and Sui's native on-chain randomness, this project ensures that every raffle drawing is 100% transparent, tamper-proof, and automatically executed without the need for manual intervention or trusted third-party oracles.

## 💻 Comprehensive Tech Stack

This project is built using modern web3 and web2 technologies to ensure performance, security, and a seamless user experience.

### Frontend
- **Framework:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/) with [SWC plugin](https://swc.rs/) for extremely fast compilation.
- **Web3 Integration:** 
  - [`@mysten/dapp-kit`](https://sui.io/): Providing connection state management and transaction signing.
  - [`@mysten/sui`](https://sui.io/): The official Sui TypeScript SDK for network interaction.
- **State Management & Data Fetching:** [TanStack React Query (v5)](https://tanstack.com/query/latest) for efficient RPC fetching and caching.
- **Routing:** [React Router DOM (v7)](https://reactrouter.com/) for client-side navigation.
- **UI Components & Styling:** 
  - [Radix UI Themes & Primitives](https://www.radix-ui.com/): An accessible, highly customizable component library.
  - [Radix UI Icons](https://icons.radix-ui.com/): Crisp and consistent icon set.
  - Custom Vanilla CSS (`styles.css`) for specific visual enhancements.
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/) for rich, toast-based transaction feedback.
- **Code Quality:** ESLint and Prettier for strict static analysis and code formatting.

### Smart Contract
- **Language:** [Sui Move](https://docs.sui.io/concepts/sui-move-concepts)
- **Frameworks/Modules:** 
  - `sui::random`: For secure, unbiasable on-chain randomness generation.
  - `sui::clock`: For precise temporal validation (deadline mechanisms).
  - `sui::coin` & `sui::balance`: For secure on-chain asset management.
  - `sui::event`: For emitting transaction logs consumed by the frontend.

## 🔍 Smart Contract Analysis & Core Mechanics

The backend of SuiRaffle is powered by a robust Sui Move smart contract (`game.move`). Below is an in-depth architectural breakdown of its operations:

1. **Shared Object Architecture (`RafflePool`):** 
   Each raffle is instantiated as a shared object on the Sui network. This allows concurrent ticket purchases from multiple participants globally without state bottlenecks. It securely stores the state including the current balance, ticket metrics, and the list of participant addresses.

2. **Native Unbiasable Randomness:** 
   The contract utilizes Sui's native `sui::random` module. This provides a highly secure source of randomness integrated directly into the blockchain's consensus layer, eliminating vulnerabilities commonly associated with external oracle dependencies or block-hash-based RNGs.

3. **Auto-Settlement Mechanism:**
   Instead of relying on an administrative wallet or an external "crank" to trigger the draw, the contract features an auto-trigger mechanism. Within the `buy_ticket` function, if the condition `tickets_sold == max_tickets` is met, the contract immediately invokes the private `settle_pool` function within the same transaction. This ensures instant finality and zero delay in declaring winners.

4. **Immutable Revenue Distribution:**
   The logic dictating the distribution of accumulated funds is hardcoded and immutable:
   - **5%** allocated to the Platform (Protocol Fee).
   - **5%** allocated to the Creator of the Raffle Pool.
   - **90%** divided equally among the determined winners.
   All funds are routed via the native `sui::balance::take` and `sui::transfer::public_transfer` methods, providing atomic and secure payouts.

5. **Anti-Duplicate Multi-Winner Logic:**
   The contract natively supports multiple winners per pool. To guarantee fairness, it employs a `swap_remove` algorithm on the dynamic vector of participants. Once an index is drawn, that participant's address is removed from the array, rendering it mathematically impossible for the same address to be drawn twice in the same raffle pool.

## 🚀 Application Workflow

1. **Pool Creation:**
   - A user connects their Sui wallet and specifies the `ticket_price`, `max_tickets`, `num_winners`, and expiration duration.
   - The contract creates a new `RafflePool` shared object and emits a `PoolCreated` event.
2. **Exploration & Participation:**
   - The frontend queries all active `RafflePool` objects dynamically and displays them on the Dashboard.
   - Users can seamlessly purchase tickets by submitting a transaction that passes a `sui::coin` matching the exact `ticket_price`. 
3. **Execution & Payout:**
   - Once the pool reaches its maximum capacity, the smart contract automatically executes the draw.
   - It calculates the fee splits, loops through the remaining participants to draw the designated number of winners, and instantly transfers the SUI prizes directly to the winners' wallets.

## 🛠️ Repository Structure

```text
SuiRaffle/
├── smartcontract/       # Sui Move Smart Contract Directory
│   ├── sources/         # Move source files (e.g., game.move)
│   ├── tests/           # Unit tests for the contract logic
│   └── Move.toml        # Package manifest and dependencies
├── src/                 # React Frontend Directory
│   ├── components/      # Reusable UI elements (RaffleCard, Layout, Header)
│   ├── hooks/           # Custom React hooks (e.g., usePools for RPC data)
│   ├── pages/           # Application views (DashboardPage, CreatePage, etc.)
│   ├── utils/           # Helper scripts (formatting, blockchain interaction)
│   └── main.tsx         # React application entry point
├── index.html           # HTML template
├── package.json         # Node.js dependencies and scripts
└── vite.config.mts      # Vite bundler configuration
```

## ⚙️ Installation & Setup Guide

### Prerequisites
- **Node.js** (v18+ recommended)
- **Sui CLI** (For smart contract compilation and deployment)
- **Sui Wallet** (Browser extension for interacting with the dApp)

### 1. Smart Contract Deployment (Sui Move)
1. Navigate to the smart contract directory:
   ```bash
   cd smartcontract
   ```
2. Build the contract to verify logical integrity:
   ```bash
   sui move build
   ```
3. Publish the contract to the targeted network (Testnet/Mainnet):
   ```bash
   sui client publish --gas-budget 100000000
   ```
4. Note the generated `Package ID` from the transaction output.

### 2. Frontend Initialization
1. From the project root, install all node dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory (or configure your environment variables) and supply the `Package ID` obtained from the deployment step. Example:
   ```env
   VITE_PACKAGE_ID=0x_YOUR_PUBLISHED_PACKAGE_ID
   VITE_MODULE=game
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Access the application via `http://localhost:5173`.

## 👨‍💻 Contributors

- **[YosuaSurianto](https://github.com/YosuaSurianto)** – Smart Contract Move Developer
- **[AddinRizal](https://github.com/AddinRizal)** – Frontend Developer

---
