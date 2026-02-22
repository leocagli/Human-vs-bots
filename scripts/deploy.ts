/**
 * deploy.ts
 *
 * Deploys the ClawbotVaultWars Soroban smart contract to a Stellar network.
 *
 * Usage:
 *   npx ts-node scripts/deploy.ts [--network testnet|mainnet|local]
 *
 * Environment variables (or .env file):
 *   STELLAR_SECRET_KEY   – deployer account secret key
 *   STELLAR_RPC_URL      – Soroban RPC endpoint (overrides --network default)
 *   STELLAR_NETWORK_PASSPHRASE – network passphrase (overrides default)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NETWORKS: Record<string, { rpcUrl: string; passphrase: string }> = {
  local: {
    rpcUrl: "http://localhost:8000/soroban/rpc",
    passphrase: "Standalone Network ; February 2017",
  },
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
  },
  mainnet: {
    rpcUrl: "https://soroban-mainnet.stellar.org",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
};

const WASM_PATH = path.resolve(
  __dirname,
  "../contracts/target/wasm32-unknown-unknown/release/clawbot_vault_wars.wasm"
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(): { network: string } {
  const args = process.argv.slice(2);
  const networkIdx = args.indexOf("--network");
  const network =
    networkIdx !== -1 && args[networkIdx + 1]
      ? args[networkIdx + 1]
      : "testnet";
  return { network };
}

function run(cmd: string): string {
  console.log(`\n$ ${cmd}`);
  const output = execSync(cmd, { encoding: "utf8" });
  console.log(output);
  return output.trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { network } = parseArgs();

  const cfg = NETWORKS[network];
  if (!cfg) {
    console.error(`Unknown network "${network}". Choose: ${Object.keys(NETWORKS).join(", ")}`);
    process.exit(1);
  }

  const rpcUrl = process.env.STELLAR_RPC_URL ?? cfg.rpcUrl;
  const passphrase = process.env.STELLAR_NETWORK_PASSPHRASE ?? cfg.passphrase;
  const secretKey = process.env.STELLAR_SECRET_KEY;

  if (!secretKey) {
    console.error(
      "STELLAR_SECRET_KEY environment variable is not set.\n" +
        "Export it before running deploy.ts."
    );
    process.exit(1);
  }

  if (!fs.existsSync(WASM_PATH)) {
    console.error(`WASM file not found at: ${WASM_PATH}`);
    console.error("Run `cargo build --target wasm32-unknown-unknown --release` first.");
    process.exit(1);
  }

  console.log(`\n🚀 Deploying ClawbotVaultWars to ${network}…`);
  console.log(`   RPC: ${rpcUrl}`);

  // Upload contract WASM and capture the resulting contract hash.
  const uploadOutput = run(
    `stellar contract upload ` +
      `--wasm ${WASM_PATH} ` +
      `--source ${secretKey} ` +
      `--rpc-url ${rpcUrl} ` +
      `--network-passphrase "${passphrase}"`
  );

  const wasmHash = uploadOutput.split("\n").pop() ?? "";
  console.log(`\n✅ WASM uploaded. Hash: ${wasmHash}`);

  // Deploy a contract instance from the uploaded WASM hash.
  const deployOutput = run(
    `stellar contract deploy ` +
      `--wasm-hash ${wasmHash} ` +
      `--source ${secretKey} ` +
      `--rpc-url ${rpcUrl} ` +
      `--network-passphrase "${passphrase}"`
  );

  const contractId = deployOutput.split("\n").pop() ?? "";
  console.log(`\n✅ Contract deployed. ID: ${contractId}`);
  console.log("\nSave this contract ID in your .env file as VITE_CONTRACT_ID.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
