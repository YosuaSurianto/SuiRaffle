# Sui dApp Starter Template

This dApp was created using `@mysten/create-dapp` that sets up a basic React
Client dApp using the following tools:

- [React](https://react.dev/) as the UI framework
- [TypeScript](https://www.typescriptlang.org/) for type checking
- [Vite](https://vitejs.dev/) for build tooling
- [Radix UI](https://www.radix-ui.com/) for pre-built UI components
- [ESLint](https://eslint.org/)
- [`@mysten/dapp-kit`](https://sdk.mystenlabs.com/dapp-kit) for connecting to
  wallets and loading data
- [pnpm](https://pnpm.io/) for package management

## Starting your dApp

To install dependencies you can run

```bash
pnpm install
```

To start your dApp in development mode run

```bash
pnpm dev
```

## Config (package id)

Frontend ini ambil semua raffle dari event `PoolCreated` on-chain. Jadi yang perlu kamu set cuma:

```bash
# .env.local
VITE_PACKAGE_ID=0x... # package id hasil publish Move
VITE_MODULE=game      # optional (default: game)
```

## UX

- **Explore**: list raffle dalam bentuk **card grid**, player tinggal klik **Join & Pay**.
- **Toast notifications**: approve / success / reject dibuat lebih jelas (pakai `sonner`).

## Deploy ke Vercel (Vite)

1. Import repo ke Vercel.
2. Framework preset: **Vite**.
3. Build command: `pnpm build`
4. Output directory: `dist`
5. Set Environment Variables di Vercel:
   - `VITE_PACKAGE_ID`
   - `VITE_MODULE` (optional)

## Building

To build your app for deployment you can run

```bash
pnpm build
```
