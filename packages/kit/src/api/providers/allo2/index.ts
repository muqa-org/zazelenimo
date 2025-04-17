import { Allo, Registry } from "@allo-team/allo-v2-sdk/";
import {
  PublicClient,
  encodePacked,
  getAddress,
  publicActions,
  keccak256,
  zeroAddress,
  WalletClient,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";
import { decodeEventLog, type Address, type Chain } from "viem";

import { initializeComethSmartAccount } from "../../../config/comethSmartAccount.js";
import { API } from "../../types.js";

// Define a minimal ABI for the events we need
const AlloABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: true, name: "profileId", type: "bytes32" },
      { indexed: false, name: "strategy", type: "address" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      {
        indexed: false,
        name: "metadata",
        type: "tuple",
        components: [
          { name: "protocol", type: "uint256" },
          { name: "pointer", type: "string" },
        ],
      },
    ],
    name: "PoolCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "profileId", type: "bytes32" },
      { indexed: false, name: "nonce", type: "uint256" },
      { indexed: false, name: "name", type: "string" },
      {
        indexed: false,
        name: "metadata",
        type: "tuple",
        components: [
          { name: "protocol", type: "uint256" },
          { name: "pointer", type: "string" },
        ],
      },
      { indexed: false, name: "owner", type: "address" },
      { indexed: false, name: "anchor", type: "address" },
    ],
    name: "ProfileCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "recipientId", type: "address" },
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: true, name: "status", type: "uint8" },
    ],
    name: "UpdatedRegistration",
    type: "event",
  },
];

const createAlloOpts = (chain: Chain) => ({
  chain: chain.id,
  rpc: chain.rpcUrls.default.http[0],
});
function getProfileId(address: Address): Address {
  return keccak256(encodePacked(["uint256", "address"], [BigInt(0), address]));
}

export const alloNativeToken: Address =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const allo2API: Partial<API> = {
  createRound: async function (data, signer: WalletClient, account) {
    try {
      let smartAccount: any;
      let smartAccountClient: any;
      if (account?.address) {
        smartAccountClient = await initializeComethSmartAccount(
          account.address,
        );
        smartAccount = smartAccountClient.account;
      }

      if (!signer?.account) throw new Error("Signer missing");

      const allo = new Allo(createAlloOpts(signer.chain!));

      const client = signer.extend(publicActions);
      // Annoying that a profile must be created to deploy a pool
      const profileId = await getOrCreateProfile(signer, smartAccountClient);

      const {
        amount = BigInt(0),
        metadata,
        strategy,
        token,
        managers = [],
        initStrategyData = "0x",
      } = data;
      if (typeof initStrategyData !== "string")
        throw new Error("initStrategyData must be a bytes string.");

      const txData = allo.createPool({
        profileId,
        strategy,
        // Set token address to native token if empty or zero address
        token: !token || token === zeroAddress ? alloNativeToken : token,
        managers,
        amount,
        metadata,
        initStrategyData,
      });
      console.log("txData", txData);

      // Send the transaction using the smart account client
      const txHash = await smartAccountClient.sendTransaction({
        to: txData.to as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(0),
      });
      console.log("txHash", txHash);

      // Wait for the transaction receipt
      const receipt = await smartAccountClient.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log("receipt", receipt);

      // Wait for PoolCreated event and return poolId
      return createLogDecoder(AlloABI, client)(txHash, ["PoolCreated"]).then(
        (logs) => {
          const id = String((logs?.[0]?.args as { poolId: bigint }).poolId);
          return { id, chainId: signer.chain?.id as number };
        },
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  createApplication: async function (data, signer) {
    try {
      if (!signer?.account) throw new Error("Signer missing");
      const allo = new Allo(createAlloOpts(signer.chain!));

      const client = signer.extend(publicActions);

      const { roundId, strategyData = "0x" } = data;

      const tx = allo.registerRecipient(roundId, strategyData);

      const hash = await this.sendTransaction?.(tx, signer);

      // Wait for PoolCreated event and return poolId
      return createLogDecoder(AlloABI, client)(hash!, [
        "UpdatedRegistration",
      ]).then((logs) => {
        const id = String(
          (logs?.[0]?.args as { recipientId: Address }).recipientId,
        );
        return { id, chainId: signer.chain?.id as number };
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  createProject: async function (data, signer) {
    try {
      if (!signer?.account) throw new Error("Signer missing");

      throw new Error("Create Project not implemented yet");
      // This code is unreachable, but we'll keep it for future implementation
      // return { id: 'id', chainId };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  allocate: async function (tx, signer) {
    try {
      return await this.sendTransaction?.(tx, signer);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  distribute: () => {},
};

async function getOrCreateProfile(
  signer: WalletClient,
  smartAccountClient: any,
) {
  const registry = new Registry(createAlloOpts(signer.chain!));
  const address = getAddress(signer.account?.address!);
  return registry
    ?.getProfileById(getProfileId(signer.account?.address!))
    .then(async (profile) => {
      if (profile?.anchor === zeroAddress) {
        return profile.id;
      }

      const txData = registry.createProfile({
        nonce: BigInt(0),
        members: [address],
        owner: address,
        metadata: { protocol: BigInt(1), pointer: "" },
        name: "",
      });
      console.log("txData", txData);

      // Send the transaction using the smart account client
      const txHash = await smartAccountClient.sendTransaction({
        to: txData.to as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(0),
      });
      console.log("txHash", txHash);

      // Wait for the transaction receipt
      const receipt = await smartAccountClient.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log("receipt", receipt);

      // This will not work with built in Cometh getTransaction because it
      // only checks for ExecutionSuccess event, and we need a specific event to
      // get things like profile id from the ProfileCreated event
      return createLogDecoder(AlloABI, signer.extend(publicActions))(txHash, [
        "ProfileCreated",
      ]).then((logs) => (logs?.[0]?.args as { profileId: Address })?.profileId);
    });
}

function createLogDecoder(
  abi: readonly unknown[],
  client?: {
    waitForTransactionReceipt: PublicClient["waitForTransactionReceipt"];
  },
) {
  return async (hash: Address, events: string[]) =>
    client?.waitForTransactionReceipt({ hash }).then(({ logs }) => {
      return logs
        .map(({ data, topics }) => {
          try {
            const decoded = decodeEventLog({ abi, data, topics });
            return events.includes(decoded.eventName) ? decoded : null;
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean);
    });
}

export const encoders = {
  directGrants: encodeDirectGrantsLiteData,
};

function encodeDirectGrantsLiteData(data: {
  registrationStartTime: string;
  registrationEndTime: string;
}) {
  return encodeAbiParameters(
    parseAbiParameters([
      "InitializeData data",
      "struct InitializeData { bool useRegistryAnchor; bool metadataRequired; uint64 registrationStartTime; uint64 registrationEndTime; }",
    ]),
    [
      {
        useRegistryAnchor: false,
        metadataRequired: true,
        registrationStartTime: dateToUint64(
          new Date(data.registrationStartTime),
        ),
        registrationEndTime: dateToUint64(new Date(data.registrationEndTime)),
      },
    ],
  );
}

export function dateToUint64(date: Date) {
  return BigInt(Math.round(Number(date) / 1000));
}
