# Implementing Passkey Authentication with Cometh Connect 4337 SDK and NextAuth.js

## Table of Contents

- [1. Introduction](#1-introduction)
  - [Goal](#1a-goal-integrating-cometh-connect-passkeys-with-nextauthjs-via-direct-sdk-calls)
  - [Core Technologies](#1b-core-technologies-overview)
  - [Benefits](#1c-benefits)
  - [API Scope](#1d-cometh-api-scope-vs-standard-rpc-calls)
- [2. Prerequisites & Setup](#2-prerequisites--setup)
  - [Required Dependencies](#2a-required-dependencies)
  - [Environment Variables](#2b-environment-variables)
  - [Prisma Schema](#2c-prisma-schema)
  - [Setup Steps](#2d-setup-steps)
- [3. Backend Implementation](#3-backend-implementation-nextauth--nonce-api)
  - [Nonce API Endpoint](#3a-nonce-api-endpoint-apiauthnonce)
  - [NextAuth Configuration](#3b-nextauth-configuration-apiauthnextauthroutets)
- [4. Frontend Implementation](#4-frontend-implementation-authentication-flows)
  - [New User Registration Flow](#4a-frontend-new-user-registration-flow)
  - [Existing User Login Flow](#4b-frontend-existing-user-login-flow)
  - [Unified Auth Button Component](#4c-unified-auth-button-component-authbuttonunifiedtsx)
- [5. Security Considerations](#5-security-considerations)
- [6. Conclusion & Resources](#6-conclusion--resources)
  - [Summary](#6a-summary)
  - [Resources](#6b-resources)

## 1. Introduction

### 1.a. Goal: Integrating Cometh Connect Passkeys with NextAuth.js via Direct SDK Calls

This guide provides a comprehensive, step-by-step implementation plan for integrating Cometh Connect's passkey-based smart contract wallets with NextAuth.js authentication within a Next.js application. The primary objective is to enable a seamless, secure, and passwordless user authentication experience leveraging WebAuthn technology and ERC-4337 Account Abstraction principles.

### 1.b. Core Technologies Overview

This implementation relies on a synergy of modern Web3 and web authentication technologies:

- **Cometh Connect 4337 SDK (`@cometh/connect-sdk-4337`)**: Central SDK for passkey management and ERC-4337 smart wallet operations
- **Passkeys (WebAuthn)**: W3C standard for passwordless authentication using public-key cryptography
- **ERC-4337 (Account Abstraction)**: Ethereum standard for smart contract wallets
- **EIP-1271 / EIP-6492**: Standards for smart contract signature verification
- **NextAuth.js**: Authentication library for Next.js applications
- **viem**: Modern TypeScript interface for Ethereum interaction

### 1.c. Benefits

- **Passwordless Authentication**: Eliminates password management
- **Enhanced Security**: Non-custodial smart contract wallets with phishing protection
- **Improved User Experience**: Streamlined onboarding with familiar device authentication
- **Smart Wallet Features**: Transaction batching and gas abstraction

### 1.d. Cometh API Scope vs. Standard RPC Calls

- **Cometh Connect APIs**: Specialized services for Account Abstraction infrastructure
- **Standard Ethereum JSON-RPC**: Basic blockchain interactions via node providers

## 2. Prerequisites & Setup

### 2.a. Required Dependencies

```bash
# Using pnpm
pnpm add next react react-dom next-auth @cometh/connect-sdk-4337 viem @prisma/client
pnpm add --save-dev prisma
```

### 2.b. Environment Variables

Required environment variables in `.env.local`:

| Variable                     | Description                | Example Value                         | Required |
| ---------------------------- | -------------------------- | ------------------------------------- | -------- |
| `NEXTAUTH_URL`               | Canonical URL              | `http://localhost:3000`               | Yes      |
| `NEXTAUTH_SECRET`            | NextAuth.js secret key     | `your_secret`                         | Yes      |
| `DATABASE_URL`               | Database connection string | `postgresql://user:pass@host:port/db` | Yes      |
| `NEXT_PUBLIC_COMETH_API_KEY` | Cometh Connect API key     | `your_api_key`                        | Yes      |
| `RPC_URL`                    | JSON-RPC endpoint          | `https://polygon-rpc.com`             | Yes      |
| `NEXT_PUBLIC_BUNDLER_URL`    | ERC-4337 Bundler URL       | Optional                              | No       |

### 2.c. Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  name          String?
  email         String?   @unique
  nonce         String?
  nonceExpiry   DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 2.d. Setup Steps

1. Obtain Cometh API Key from the [Cometh Connect dashboard](https://app.cometh.io)
2. Set up your database
3. Run Prisma migrations: `pnpm prisma migrate dev --name init`

## 3. Backend Implementation (NextAuth & Nonce API)

### 3.a. Nonce API Endpoint (/api/auth/nonce)

```typescript
// src/app/api/auth/nonce/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isAddress } from "viem";
import crypto from "crypto";

const prisma = new PrismaClient();
const NONCE_EXPIRY_MINUTES = 5;

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json(
        { message: "Invalid or missing wallet address" },
        { status: 400 }
      );
    }

    const nonce = crypto.randomBytes(32).toString("hex");
    const nonceExpiry = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.upsert({
      where: { walletAddress: walletAddress },
      update: {
        nonce: nonce,
        nonceExpiry: nonceExpiry,
      },
      create: {
        walletAddress: walletAddress,
        nonce: nonce,
        nonceExpiry: nonceExpiry,
        isActive: true,
      },
    });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("Nonce generation error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

### 3.b. NextAuth Configuration (/api/auth/[...nextauth]/route.ts)

```typescript
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, isAddress, verifyMessage, Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";

const prisma = new PrismaClient();

// Configure your Viem Public Client
const publicClient = createPublicClient({
  chain: arbitrumSepolia, // Use the chain your app targets
  transport: http(process.env.RPC_URL),
});

// Define custom user type for authorize return and JWT/Session callbacks
interface CustomUser extends NextAuthUser {
  id: string;
  walletAddress: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Cometh Passkey",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signedNonce: { label: "Signed Nonce", type: "text" },
        challenge: { label: "Nonce Challenge", type: "text" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (
          !credentials?.walletAddress ||
          !credentials.signedNonce ||
          !credentials.challenge
        ) {
          console.error("Missing credentials for authorization");
          throw new Error("Missing credentials");
        }
        const { walletAddress, signedNonce, challenge } = credentials;
        if (!isAddress(walletAddress)) {
          console.error("Invalid wallet address format:", walletAddress);
          throw new Error("Invalid wallet address format");
        }

        try {
          // Retrieve User and Stored Nonce from DB
          const user = await prisma.user.findUnique({
            where: { walletAddress: walletAddress },
          });
          if (!user) {
            console.error("User not found for address:", walletAddress);
            throw new Error("User not found. Please register first.");
          }
          if (!user.nonce || !user.nonceExpiry) {
            console.error("Nonce or expiry missing for user:", walletAddress);
            throw new Error(
              "Authentication challenge not found or expired. Please try again."
            );
          }

          // Validate Nonce Content and Expiry
          if (user.nonce !== challenge) {
            console.error("Nonce mismatch for user:", walletAddress);
            throw new Error("Invalid authentication challenge.");
          }
          if (new Date() > user.nonceExpiry) {
            console.error("Nonce expired for user:", walletAddress);
            // Clear expired nonce for security
            await prisma.user.update({
              where: { id: user.id },
              data: { nonce: null, nonceExpiry: null },
            });
            throw new Error(
              "Authentication challenge expired. Please try again."
            );
          }

          // Verify Signature (EIP-1271 / EIP-6492)
          console.log(
            `Verifying signature for address ${walletAddress} with challenge ${challenge}`
          );
          const isValidSignature = await publicClient.verifyMessage({
            address: walletAddress as `0x${string}`,
            message: challenge,
            signature: signedNonce as Hex,
          });

          if (!isValidSignature) {
            console.error(
              "Signature verification failed for user:",
              walletAddress
            );
            throw new Error("Signature verification failed.");
          }
          console.log(
            "Signature verification successful for user:",
            walletAddress
          );

          // Update DB - Invalidate Nonce
          await prisma.user.update({
            where: { id: user.id },
            data: { nonce: null, nonceExpiry: null },
          });

          // Check User Status
          if (!user.isActive) {
            console.warn("Attempted login by inactive user:", walletAddress);
            throw new Error("Account is disabled.");
          }

          // Return User Object
          console.log(
            "Authorization successful for user:",
            user.id,
            user.walletAddress
          );
          return {
            id: user.id,
            walletAddress: user.walletAddress,
          };
        } catch (error: any) {
          console.error("Authorization error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.userId = customUser.id;
        token.walletAddress = customUser.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).walletAddress = token.walletAddress;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## 4. Frontend Implementation (Authentication Flows)

### 4.a. Frontend: New User Registration Flow

```typescript
// Example registration flow implementation
import {
  createSafeSmartAccount,
  createSmartAccountClient,
} from "@cometh/connect-sdk-4337";
import { arbitrumSepolia } from "viem/chains";

async function handleRegister() {
  const apiKey = process.env.NEXT_PUBLIC_COMETH_API_KEY;
  if (!apiKey) throw new Error("API Key not configured");

  // Create new smart account and passkey
  const smartAccount = await createSafeSmartAccount({
    apiKey: apiKey,
    chain: arbitrumSepolia,
  });

  const predictedAddress = smartAccount.address;
  console.log("Predicted Wallet Address:", predictedAddress);

  // Initialize SmartAccountClient
  const client = createSmartAccountClient({
    account: smartAccount,
    chain: arbitrumSepolia,
    apiKey: apiKey,
  });

  // Get nonce
  const nonce = await fetchNonce(predictedAddress);

  // Sign nonce
  const signedNonce = await signNonce(client, nonce);

  // Trigger NextAuth Sign-In
  await callNextAuthSignIn(predictedAddress, signedNonce, nonce);
}

async function fetchNonce(walletAddress: string): Promise<string> {
  const response = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Nonce API request failed: ${response.status}`
    );
  }
  const data = await response.json();
  if (!data.nonce) throw new Error("Nonce not received from API");
  return data.nonce;
}

async function signNonce(client: any, nonce: string): Promise<Hex> {
  if (!client?.account?.signMessage) {
    throw new Error(
      "SmartAccountClient is invalid or signMessage is unavailable."
    );
  }
  try {
    const signature = await client.account.signMessage({ message: nonce });
    return signature as Hex;
  } catch (error: any) {
    console.error("Signing error:", error);
    throw new Error(
      `Failed to sign message: ${error.message || "Unknown error"}`
    );
  }
}

async function callNextAuthSignIn(
  walletAddress: string,
  signedNonce: Hex,
  challenge: string
) {
  const signInResponse = await signIn("cometh-credentials", {
    walletAddress: walletAddress,
    signedNonce: signedNonce,
    challenge: challenge,
    redirect: false,
  });

  if (!signInResponse?.ok) {
    console.error("Sign-in failed:", signInResponse?.error);
    throw new Error(signInResponse?.error || "Authentication failed");
  }
  console.log("Sign-in successful!");
  return signInResponse;
}
```

### 4.b. Frontend: Existing User Login Flow

```typescript
// Example login flow implementation
import {
  retrieveAccountAddressFromPasskey,
  createSafeSmartAccount,
  createSmartAccountClient,
} from "@cometh/connect-sdk-4337";
import { arbitrumSepolia } from "viem/chains";

async function handleLogin() {
  const apiKey = process.env.NEXT_PUBLIC_COMETH_API_KEY;
  if (!apiKey) throw new Error("API Key not configured");

  // Retrieve existing wallet address
  const retrievedAddress = await retrieveAccountAddressFromPasskey(apiKey);
  console.log("Retrieved Wallet Address:", retrievedAddress);

  // Initialize client for existing wallet
  const smartAccount = await createSafeSmartAccount({
    apiKey: apiKey,
    chain: arbitrumSepolia,
    smartAccountAddress: retrievedAddress as `0x${string}`,
  });

  const client = createSmartAccountClient({
    account: smartAccount,
    chain: arbitrumSepolia,
    apiKey: apiKey,
  });

  // Get nonce
  const nonce = await fetchNonce(retrievedAddress);

  // Sign nonce
  const signedNonce = await signNonce(client, nonce);

  // Trigger NextAuth Sign-In
  await callNextAuthSignIn(retrievedAddress, signedNonce, nonce);
}
```

### 4.c. Unified Auth Button Component (AuthButtonUnified.tsx)

```typescript
// src/components/AuthButtonUnified.tsx
"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  createSafeSmartAccount,
  retrieveAccountAddressFromPasskey,
  createSmartAccountClient,
} from "@cometh/connect-sdk-4337";
import { Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";

async function fetchNonce(walletAddress: string): Promise<string> {
  const response = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Nonce API request failed: ${response.status}`
    );
  }
  const data = await response.json();
  if (!data.nonce) throw new Error("Nonce not received from API");
  return data.nonce;
}

async function signNonce(client: any, nonce: string): Promise<Hex> {
  if (!client?.account?.signMessage) {
    throw new Error(
      "SmartAccountClient is invalid or signMessage is unavailable."
    );
  }
  try {
    const signature = await client.account.signMessage({ message: nonce });
    return signature as Hex;
  } catch (error: any) {
    console.error("Signing error:", error);
    throw new Error(
      `Failed to sign message: ${error.message || "Unknown error"}`
    );
  }
}

async function callNextAuthSignIn(
  walletAddress: string,
  signedNonce: Hex,
  challenge: string
): Promise<any> {
  const signInResponse = await signIn("cometh-credentials", {
    walletAddress: walletAddress,
    signedNonce: signedNonce,
    challenge: challenge,
    redirect: false,
  });

  if (!signInResponse?.ok) {
    console.error("Sign-in failed:", signInResponse?.error);
    throw new Error(signInResponse?.error || "Authentication failed");
  }
  console.log("Sign-in successful via NextAuth!");
  return signInResponse;
}

export default function AuthButtonUnified() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comethApiKey = process.env.NEXT_PUBLIC_COMETH_API_KEY;

  if (!comethApiKey) {
    return (
      <p className="text-red-500">Error: Cometh API Key not configured.</p>
    );
  }

  const handleConnectOrRegister = async () => {
    setIsLoading(true);
    setError(null);
    let smartAccountClientInstance: any = null;
    let walletAddress: string | null = null;
    let nonce: string | null = null;
    let signature: Hex | null = null;

    try {
      // Attempt Login
      console.log("Attempting to retrieve wallet address via passkey...");
      try {
        walletAddress = await retrieveAccountAddressFromPasskey(comethApiKey);
        console.log("Existing wallet address retrieved:", walletAddress);

        // Initialize client for existing wallet
        const smartAccount = await createSafeSmartAccount({
          apiKey: comethApiKey,
          chain: arbitrumSepolia,
          smartAccountAddress: walletAddress as `0x${string}`,
        });
        console.log(
          "SmartAccount object obtained for existing wallet:",
          smartAccount
        );

        smartAccountClientInstance = createSmartAccountClient({
          account: smartAccount,
          chain: arbitrumSepolia,
          apiKey: comethApiKey,
        });
        console.log("SmartAccountClient initialized for existing wallet.");
      } catch (loginError: any) {
        console.warn("Retrieve address error:", loginError);

        // Handle "No Passkey Found" for Registration Fallback
        const isNoPasskeyError =
          loginError.message?.toLowerCase().includes("no passkey found") ||
          loginError.message?.toLowerCase().includes("cancelled") ||
          loginError.name === "NotFoundError" ||
          loginError.name === "AbortError";

        if (isNoPasskeyError) {
          console.log(
            "No existing passkey found or process cancelled. Proceeding to registration..."
          );

          // Initiate Registration
          const smartAccount = await createSafeSmartAccount({
            apiKey: comethApiKey,
            chain: arbitrumSepolia,
          });
          walletAddress = smartAccount.address;
          console.log("New wallet address predicted:", walletAddress);
          console.log(
            "SmartAccount object created for new wallet:",
            smartAccount
          );

          // Initialize client for new wallet
          smartAccountClientInstance = createSmartAccountClient({
            account: smartAccount,
            chain: arbitrumSepolia,
            apiKey: comethApiKey,
          });
          console.log("SmartAccountClient initialized for new wallet.");
        } else {
          throw new Error(
            `Login failed: ${
              loginError.message || "Unknown error during login attempt"
            }`
          );
        }
      }

      // Fetch Nonce
      if (!walletAddress || !smartAccountClientInstance) {
        throw new Error(
          "Wallet address or client not available after login/registration attempt."
        );
      }
      console.log(`Fetching nonce for ${walletAddress}...`);
      nonce = await fetchNonce(walletAddress);
      console.log("Nonce received:", nonce);

      // Sign Nonce
      console.log("Signing nonce...");
      signature = await signNonce(smartAccountClientInstance, nonce);
      console.log("Nonce signed successfully:", signature);

      // Call NextAuth signIn
      console.log("Calling NextAuth signIn to trigger backend verification...");
      await callNextAuthSignIn(walletAddress, signature, nonce);
    } catch (err: any) {
      console.error("Authentication process error:", err);
      setError(
        err.message || "An unexpected error occurred during authentication."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (session) {
    const userWalletAddress = (session.user as any)?.walletAddress;
    return (
      <div className="p-4 border rounded-lg shadow bg-gray-50">
        <p className="text-gray-700">Signed in as:</p>
        {userWalletAddress && (
          <p className="font-mono text-sm text-blue-600 break-all">
            {userWalletAddress}
          </p>
        )}
        <button
          onClick={() => signOut()}
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow bg-gray-50">
      <button
        onClick={handleConnectOrRegister}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Connecting..." : "Sign In / Register with Passkey"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
    </div>
  );
}
```

## 5. Security Considerations

- **Nonce Security**
  - Server-side generation
  - Short expiry (1-5 minutes)
  - Single-use
  - Secure storage
- **Backend Signature Verification**
- **API Key Security**
- **CSRF Protection**
- **Input Validation**
- **Rate Limiting**
- **JWT Security**

## 6. Conclusion & Resources

### 6.a. Summary

This implementation provides a secure, user-friendly authentication system combining:

- Passwordless authentication via passkeys
- Smart contract wallets (ERC-4337)
- NextAuth.js session management
- Robust security measures

### 6.b. Resources

- [Cometh Connect 4337 SDK Documentation](https://docs.cometh.io/connect-4337)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Viem Documentation](https://viem.sh/)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [EIP-1271 Specification](https://eips.ethereum.org/EIPS/eip-1271)
- [EIP-6492 Specification](https://eips.ethereum.org/EIPS/eip-6492)
