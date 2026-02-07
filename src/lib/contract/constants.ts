// Load contract address from deployment file
import deployment from "./deployment.json";

export const CONTRACT_ADDRESS = deployment.address;
export const CHAIN_ID = 114; // Coston2
export const CHAIN_NAME = "Flare Testnet Coston2";
export const RPC_URL = "https://coston2-api.flare.network/ext/C/rpc";
export const BLOCK_EXPLORER = "https://coston2-explorer.flare.network";

// FTSO Feed IDs from Flare docs
export const FEED_IDS = {
    "ETH/USD": "0x014554482f55534400000000000000000000000000",
    "FLR/USD": "0x01464c522f55534400000000000000000000000000",
    "BTC/USD": "0x014254432f55534400000000000000000000000000",
} as const;
