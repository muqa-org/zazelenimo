# Integrating Cometh SDK Direct Calls with NextAuth CredentialsProvider for Passkey Authentication

## 1. Introduction

### 1.1. Context: The Rise of Smart Wallets and Passkeys

The Ethereum ecosystem is undergoing a significant evolution aimed at enhancing user experience (UX) and security, largely driven by the adoption of Account Abstraction (AA) as specified in ERC-4337. AA moves away from the limitations of Externally Owned Accounts (EOAs) by enabling the use of smart contract wallets as first-class citizens. These wallets offer programmable logic, enabling features like:

- Gas sponsorship (paymasters)
- Social recovery
- Multi-signature schemes
- Session keys

Ultimately, these features aim for a more seamless Web3 interaction model.

Concurrently, passkey technology, based on the WebAuthn standard, is emerging as a robust and user-friendly authentication method, replacing traditional passwords and potentially cumbersome seed phrases. Passkeys leverage device biometrics or security keys, offering phishing resistance and simplified login flows. Integrating passkeys with blockchain technology, particularly smart contract wallets, presents a powerful combination for secure and accessible Web3 onboarding. Cometh Connect 4337 is an SDK specifically designed to facilitate this integration, providing tools to build applications where users interact with smart wallets controlled by passkeys.

### 1.2. Objective: Integrating Cometh Direct SDK with NextAuth

This report provides a comprehensive technical guide for integrating Cometh Connect 4337's direct SDK functionalities – specifically `createSafeSmartAccount` and `retrieveAccountAddressFromPasskeys` – into a Next.js application using NextAuth.js for authentication. The focus is on utilizing NextAuth's `CredentialsProvider` combined with a database adapter (e.g., Prisma) to manage user data and the necessary cryptographic nonces for a secure challenge-response authentication flow.

### 1.3. Why This Approach?

While Cometh offers higher-level abstractions like a Wagmi connector, directly utilizing the SDK functions provides developers with finer-grained control over the authentication process. This approach might be preferable for applications requiring:

- Custom UI flows
- Specific error handling
- Deeper integration with existing backend systems

However, this increased control comes with the trade-off of greater implementation complexity compared to more abstracted solutions. This report focuses exclusively on navigating this direct SDK integration path.

### 1.4. Key Challenges Addressed

Successfully implementing this integration requires addressing several technical challenges inherent in combining passkey-based smart wallets with traditional web authentication frameworks:

1. **NextAuth CredentialsProvider Configuration**: The `CredentialsProvider` is typically associated with username/password flows. Adapting it for a signature-based flow, where credentials are a wallet address and a signed message, requires careful configuration of its authorize function and associated callbacks.

2. **Nonce-Based Challenge-Response**: Implementing a secure sign-in mechanism necessitates a challenge-response protocol using cryptographic nonces. This involves:

   - Generating unique, time-limited nonces on the backend
   - Storing them securely (typically in a database linked to the user's wallet address)
   - Verifying them during the authorization step

3. **EIP-1271 Signature Verification**: Smart contract wallets cannot sign messages in the same way EOAs do. Verifying signatures originating from smart contracts requires adherence to the EIP-1271 standard, which involves calling an `isValidSignature` function on the contract itself.

4. **Signing Client Acquisition Post-Retrieval**: A specific point of friction arises when handling logins for existing accounts. The `retrieveAccountAddressFromPasskeys` function authenticates the user and returns their wallet address but does not provide an initialized client capable of signing subsequent messages (like the nonce).

5. **Wagmi Coexistence**: Many applications utilize Wagmi for general blockchain interactions. Integrating this direct Cometh SDK flow alongside Wagmi requires careful consideration to avoid state management conflicts, particularly concerning Wagmi's connection hooks.

## 2. Prerequisites & Initial Setup

### 2.1. Required Dependencies

Ensure the following packages are installed in your Next.js project:

**Core Next.js:**

- `next`
- `react`
- `react-dom`

**Authentication:**

- `next-auth`

**Cometh SDK:**

- `@cometh/connect-sdk-4337` (Ensure this specific package is used, not older versions)

**Blockchain Interaction:**

- `viem` (Essential for EIP-1271 verification)

**Database:**

- A NextAuth database adapter (e.g., `@next-auth/prisma-adapter`)
- Corresponding ORM/client (e.g., `prisma`, `@prisma/client`)

**Optional:**

- UI component libraries (e.g., Tailwind CSS, Chakra UI)

Install using npm or yarn:

```bash
npm install next react react-dom next-auth @cometh/connect-sdk-4337 viem @next-auth/prisma-adapter prisma @prisma/client
npm install --save-dev prisma

# or with yarn
yarn add next react react-dom next-auth @cometh/connect-sdk-4337 viem @next-auth/prisma-adapter prisma @prisma/client
yarn add --dev prisma
```

### 2.2. Environment Variables

Configure the necessary environment variables in your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000 # Replace with your canonical URL in production
NEXTAUTH_SECRET= # Generate a strong secret using: openssl rand -base64 32

# Database Configuration (Example for Prisma with PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Cometh Connect Configuration
NEXT_PUBLIC_COMETH_API_KEY= # Your Cometh Connect API Key
NEXT_PUBLIC_RPC_URL= # RPC URL for your target blockchain (e.g., Arbitrum Sepolia)
NEXT_PUBLIC_BUNDLER_URL= # Cometh ERC-4337 Bundler URL
# NEXT_PUBLIC_PAYMASTER_URL= # Optional: Cometh Paymaster URL for gas sponsorship

# Make RPC_URL available server-side as well if needed for verification
RPC_URL= # Same RPC URL as above
```

> Note: Prefix environment variables intended for browser access with `NEXT_PUBLIC_`.

### 2.3. Project Structure

A typical Next.js project structure suitable for this integration might look like:

```
.
├── app/                  # Next.js App Router (or pages/)
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts # NextAuth handler
│   │       └── nonce/route.ts         # Nonce generation API
│   │   ├── layout.tsx
│   │   └── page.tsx             # Main application page
├── components/           # React components (e.g., AuthButtons.tsx)
├── lib/                  # Shared utilities, constants, DB client instance
│   └── prisma.ts         # Prisma client singleton
├── prisma/               # Prisma configuration
│   ├── schema.prisma
│   └── migrations/
├── public/
├──.env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

### 2.4. Database Schema

Define your database schema using Prisma (`prisma/schema.prisma`). Ensure it includes the standard NextAuth adapter models and the custom fields needed for this flow:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Or your chosen database
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]

  // Custom fields for Cometh + Credentials Provider flow
  walletAddress String?   @unique // Stores the Cometh Smart Wallet address
  authNonce     String?   // Stores the challenge nonce for sign-in
  nonceExpiry   DateTime? // Expiry time for the nonce
  isActive      Boolean   @default(true) // User status flag
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Purpose of Custom Fields:**

- `walletAddress`: Serves as the primary unique identifier linking the application user to their Cometh smart wallet
- `authNonce`: Temporarily stores the unique challenge sent to the user during the sign-in process
- `nonceExpiry`: Ensures the nonce is only valid for a short period, preventing replay attacks
- `isActive`: Allows for administrative control over user access

After defining the schema, run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

## 3. Backend Configuration: NextAuth & Nonce API

### 3.1. Configuring [...nextauth].ts (or route.ts in App Router)

This file configures the NextAuth.js handler, defining providers, callbacks, and session strategy.

```typescript
// app/api/auth/[...nextauth]/route.ts (or pages/api/auth/[...nextauth].ts)

import NextAuth, {
  type NextAuthOptions,
  type Session,
  type User as NextAuthUser,
} from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, Hex } from "viem";
import { arbitrumSepolia } from "viem/chains"; // Use your target chain

const prisma = new PrismaClient();

// Define custom types for JWT and Session to include walletAddress and userId
interface CustomJWT extends JWT {
  userId?: string;
  walletAddress?: string;
}

interface CustomSession extends Session {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    walletAddress?: string | null; // Add walletAddress here
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      // ... provider configuration
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser?.walletAddress) {
          token.walletAddress = dbUser.walletAddress;
        }
      }
      return token as CustomJWT;
    },
    async session({ session, token }) {
      const customSession = session as CustomSession;
      if (token?.userId && customSession.user) {
        customSession.user.id = token.userId as string;
      }
      if (token?.walletAddress && customSession.user) {
        customSession.user.walletAddress = token.walletAddress as string;
      }
      return customSession;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### Session Strategy Explanation

A critical aspect of using `CredentialsProvider` is the session strategy. NextAuth.js documentation and common practice indicate that `CredentialsProvider` is designed to work primarily with the `jwt` session strategy. Even when a database adapter (like `PrismaAdapter`) is configured, the adapter's role shifts when `CredentialsProvider` is the means of authentication.

Instead of storing the session itself in the database (as it would with OAuth providers using the database strategy), the adapter is primarily used here to persist user data (like `walletAddress`, `name`, etc.) and potentially related authentication artifacts like the `authNonce`. The session state itself is managed via a JSON Web Token (JWT) stored in a cookie.

This distinction is important: developers accustomed to OAuth flows with database adapters might expect automatic session persistence in the DB. With `CredentialsProvider`, the JWT holds the session information, and the `jwt` and `session` callbacks become essential for enriching this token and exposing the necessary user data (fetched from the database via the adapter or included in the token) to the client-side `useSession` hook.

**Table 1: Session Strategy Implications with NextAuth Providers**

| Provider Type        | Session Strategy    | Database Adapter Role                                  | Key Callbacks for Custom Data | Pros                                                            | Cons                                                                          |
| -------------------- | ------------------- | ------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| OAuth (e.g., Google) | database (Default)  | Persists User, Account, Session data                   | session (receives DB user)    | Stateless server (session in DB), automatic session handling    | Requires DB connection for session checks                                     |
| Credentials          | jwt (Required)      | Persists User data (e.g., walletAddress, nonce)        | authorize, jwt, session       | Works without DB for sessions, flexible auth logic in authorize | Requires JWT strategy, manual data propagation via callbacks, JWT size limits |
| Credentials          | database (Not Rec.) | Not standard; requires complex manual session handling | signIn, session               | Allows DB sessions                                              | Against NextAuth design for Credentials, complex, error-prone                 |

This table clarifies why the `jwt` strategy is mandated for the `CredentialsProvider` flow described in this report, even with a database adapter present. The adapter handles user and nonce data, while JWT manages the session state, requiring careful implementation of the `jwt` and `session` callbacks to pass necessary data like `userId` and `walletAddress` to the client.

### 3.2. Implementing the Nonce API Endpoint (/api/auth/nonce)

This backend API route is responsible for generating and storing the cryptographic nonce used in the challenge-response flow:

```typescript
// app/api/auth/nonce/route.ts (or pages/api/auth/nonce.ts)

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();
const NONCE_EXPIRY_MINUTES = 5; // Set nonce validity duration

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (
      !walletAddress ||
      typeof walletAddress !== "string" ||
      !walletAddress.startsWith("0x")
    ) {
      return NextResponse.json(
        { message: "Invalid wallet address provided" },
        { status: 400 }
      );
    }

    // 1. Generate Secure Nonce
    const nonce = crypto.randomBytes(32).toString("hex");

    // 2. Calculate Expiry Time
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + NONCE_EXPIRY_MINUTES);

    // 3. Find or Create User and Store Nonce
    await prisma.user.upsert({
      where: { walletAddress: walletAddress },
      update: {
        authNonce: nonce,
        nonceExpiry: expiry,
      },
      create: {
        walletAddress: walletAddress,
        authNonce: nonce,
        nonceExpiry: expiry,
        isActive: true,
      },
    });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("Nonce generation error:", error);
    return NextResponse.json(
      { message: "Internal server error during nonce generation" },
      { status: 500 }
    );
  }
}
```

#### Security Considerations

- **Uniqueness**: Using `crypto.randomBytes` provides a high degree of collision resistance
- **Expiry**: A short expiry time (e.g., 5 minutes) limits the window for potential misuse
- **Storage**: Storing the nonce securely in the database, linked to the user, is crucial
- **Rate Limiting**: Implement rate limiting on this endpoint to prevent abuse
- **HTTPS**: Ensure all communication happens over HTTPS

## 4. Frontend Implementation: Account Creation Flow

### 4.1. UI Setup

Create a simple React component containing the button:

```typescript
// components/AuthButtons.tsx
'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { createSafeSmartAccount, createSmartAccountClient } from "@cometh/connect-sdk-4337";
import { http, createPublicClient, Hex } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

export default function AuthButtons() {
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [errorCreate, setErrorCreate] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setIsLoadingCreate(true);
    setErrorCreate(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_COMETH_API_KEY;
      const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;
      const chain = arbitrumSepolia;

      if (!apiKey || !bundlerUrl) {
        throw new Error("Missing Cometh configuration in environment variables.");
      }

      // Step 1: Create Smart Account
      console.log("Attempting to create smart account...");
      const publicClient = createPublicClient({ chain, transport: http() });
      const smartAccount = await createSafeSmartAccount({
        apiKey,
        publicClient,
        chain,
      });
      console.log("Smart Account instance created.");

      // Step 2: Get Wallet Address
      const walletAddress = smartAccount.address;
      console.log("Wallet Address:", walletAddress);

      // Step 3: Initialize Smart Account Client
      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain,
        bundlerTransport: http(bundlerUrl),
      });
      console.log("SmartAccountClient initialized.");

      // Step 4: Fetch Nonce
      console.log("Fetching nonce from backend...");
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.message || 'Failed to fetch nonce');
      }
      const { nonce } = await nonceResponse.json();
      console.log("Nonce received:", nonce);

      // Step 5: Sign Nonce
      console.log("Signing nonce...");
      const messageToSign = `Please sign this message to authenticate: ${nonce}`;
      const signedNonce = await smartAccountClient.signMessage({ message: messageToSign });
      console.log("Nonce signed:", signedNonce);

      // Step 6: Call NextAuth signIn
      console.log("Calling NextAuth signIn...");
      const result = await signIn('cometh-credentials', {
        walletAddress,
        signedNonce,
        challenge: nonce,
        redirect: false,
      });

      if (result?.ok) {
        console.log("Sign-in successful via NextAuth:", result);
        window.location.href = '/dashboard';
      } else {
        throw new Error(result?.error || 'NextAuth sign-in failed');
      }

    } catch (error: any) {
      console.error("Account creation/sign-in failed:", error);
      setErrorCreate(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCreateAccount}
        disabled={isLoadingCreate}
        style={{ padding: '10px', margin: '5px' }}
      >
        {isLoadingCreate ? 'Creating...' : 'Create Account & Sign In'}
      </button>
      {errorCreate && <p style={{ color: 'red' }}>Error: {errorCreate}</p>}
    </div>
  );
}
```

### 4.2. Button Click Handler Logic

The `handleCreateAccount` function implements the following steps:

1. **Call createSafeSmartAccount**:

   - Initiates the process
   - Prompts the user to create and register a passkey
   - Requires `apiKey`, `chain`, and optionally `publicClient`

2. **Capture walletAddress**:

   - The predicted smart contract wallet address is available on the returned `smartAccount` object
   - This address should be stored as the user's identifier

3. **Obtain SmartAccountClient**:

   - The `smartAccount` object is used to initialize a `SmartAccountClient`
   - This client instance holds the necessary context (linked to the newly created passkey) to perform signing operations

4. **Fetch Nonce**:

   - A request is sent to the backend `/api/auth/nonce` endpoint
   - The `walletAddress` is used to get the unique challenge

5. **Sign Nonce**:

   - The fetched nonce is signed using the `smartAccountClient.signMessage` method
   - A user-friendly message may be prefixed to the nonce

6. **Call signIn**:
   - NextAuth's `signIn` function is called with the `cometh-credentials` provider ID
   - The `walletAddress`, `signedNonce`, and original `challenge` (nonce) are passed
   - `redirect: false` allows for manual handling of success or failure

### 4.3. State Management

The example uses basic React `useState` hooks (`isLoadingCreate`, `errorCreate`) to manage:

- Button loading state
- Error display
- Multi-step process feedback

More sophisticated applications might employ:

- State management libraries
- Progress indicators
- Detailed user feedback at each stage
- Error recovery mechanisms

## 5. Frontend Implementation: Existing Account Login Flow

### 5.1. UI Setup

Add another button to the `AuthButtons` component for logging in:

```typescript
// components/AuthButtons.tsx
// ... (imports and existing state/handler)

export default function AuthButtons() {
  // ... (existing state: isLoadingCreate, errorCreate)
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoadingLogin(true);
    setErrorLogin(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_COMETH_API_KEY;
      const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;
      const chain = arbitrumSepolia;

      if (!apiKey || !bundlerUrl) {
        throw new Error("Missing Cometh configuration in environment variables.");
      }

      // Step 1: Retrieve Account Address
      console.log("Attempting to retrieve address via passkey...");
      const retrievedWalletAddress = await retrieveAccountAddressFromPasskey(apiKey);
      console.log("Passkey authentication successful.");

      // Step 2: Validate Retrieved Address
      if (!retrievedWalletAddress) {
        throw new Error("Wallet address not retrieved. User might have cancelled or no matching passkey found.");
      }
      const walletAddress = retrievedWalletAddress;
      console.log("Retrieved Wallet Address:", walletAddress);

      // Step 3: Initialize Smart Account Client
      console.log("Re-initializing SmartAccount context to get signing client...");
      const smartAccount = await createSafeSmartAccount({
        apiKey,
        chain,
        smartAccountAddress: walletAddress,
      });

      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain,
        bundlerTransport: http(bundlerUrl),
      });
      console.log("SmartAccountClient obtained for existing account.");

      // Step 4: Fetch Nonce
      console.log("Fetching nonce for login...");
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.message || 'Failed to fetch nonce');
      }
      const { nonce } = await nonceResponse.json();
      console.log("Nonce received:", nonce);

      // Step 5: Sign Nonce
      console.log("Signing nonce...");
      const messageToSign = `Please sign this message to log in: ${nonce}`;
      const signedNonce = await smartAccountClient.signMessage({ message: messageToSign });
      console.log("Nonce signed:", signedNonce);

      // Step 6: Call NextAuth signIn
      console.log("Calling NextAuth signIn for login...");
      const result = await signIn('cometh-credentials', {
        walletAddress,
        signedNonce,
        challenge: nonce,
        redirect: false,
      });

      if (result?.ok) {
        console.log("Login successful via NextAuth:", result);
        window.location.href = '/dashboard';
      } else {
        throw new Error(result?.error || 'NextAuth login failed');
      }

    } catch (error: any) {
      console.error("Login failed:", error);
      setErrorLogin(error.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoadingLogin(false);
    }
  };

  return (
    <div>
      {/* Create Button */}
      <button
        onClick={handleCreateAccount}
        disabled={isLoadingCreate || isLoadingLogin}
        style={{ padding: '10px', margin: '5px' }}
      >
        {isLoadingCreate ? 'Creating...' : 'Create Account & Sign In'}
      </button>
      {errorCreate && <p style={{ color: 'red' }}>Creation Error: {errorCreate}</p>}

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={isLoadingLogin || isLoadingCreate}
        style={{ padding: '10px', margin: '5px' }}
      >
        {isLoadingLogin ? 'Logging In...' : 'Use Existing Account / Sign In'}
      </button>
      {errorLogin && <p style={{ color: 'red' }}>Login Error: {errorLogin}</p>}
    </div>
  );
}
```

### 5.2. Button Click Handler Logic

The `handleLogin` function follows a similar pattern to creation but with a critical difference in step 3:

1. **Call retrieveAccountAddressFromPasskeys**:

   - Initiates the login flow
   - Prompts user to select and authenticate with existing passkey
   - Requires only the `apiKey`

2. **Capture walletAddress**:

   - Function returns the corresponding smart wallet address
   - Handle cases where no address is returned (cancellation, no matching passkey)

3. **Crucial: Obtain SmartAccountClient**:

   - Most complex part of the login flow
   - `retrieveAccountAddressFromPasskeys` only returns the address
   - Must call `createSafeSmartAccount` again with `smartAccountAddress` option
   - Leverages the passkey authentication from step 1
   - Yields the required `smartAccount` object for client initialization

4. **Fetch Nonce**:

   - Request fresh nonce from `/api/auth/nonce` endpoint
   - Use retrieved `walletAddress`

5. **Sign Nonce**:

   - Use `signMessage` method of the `smartAccountClient`
   - Sign the nonce with user-friendly message

6. **Call signIn**:
   - Call NextAuth's `signIn` with `cometh-credentials`
   - Pass required data (`walletAddress`, `signedNonce`, `challenge`)
   - Set `redirect: false` for manual handling

### 5.3. Error Handling

The login flow has several potential failure points:

- User cancels the passkey selection/authentication prompt
- No passkey associated with the domain is found on the device
- The `createSafeSmartAccount` call in step 3 fails
- Nonce fetching or signing fails
- NextAuth `signIn` call returns an error (invalid signature, expired nonce, inactive user)

Implement robust error handling to:

- Catch all potential issues
- Provide informative feedback to the user
- Allow for retry where appropriate
- Clear error state when retrying

## 6. Backend Implementation: Signature Verification (authorize Logic)

### 6.1. Implementing the authorize Function

The `authorize` function within the NextAuth configuration (`[...nextauth].ts`) is responsible for verifying the user's sign-in attempt:

```typescript
// Inside [...nextauth].ts authOptions -> providers -> CredentialsProvider

async authorize(credentials, req): Promise<NextAuthUser | null> {
  // Step 1: Receive Credentials
  if (!credentials?.walletAddress || !credentials?.signedNonce || !credentials?.challenge) {
    console.error('[Authorize] Missing credentials');
    throw new Error("Required credentials not provided.");
  }

  const { walletAddress, signedNonce, challenge } = credentials;
  console.log(`[Authorize] Attempting authorization for: ${walletAddress}`);

  try {
    // Step 2: Nonce Lookup & User Retrieval
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress },
    });

    if (!user) {
      console.error(`[Authorize] User not found: ${walletAddress}`);
      throw new Error("User account not found.");
    }

    // Step 3: Nonce Validity Checks
    if (!user.authNonce || !user.nonceExpiry) {
      console.error(`[Authorize] Nonce data missing for user: ${user.id}`);
      throw new Error("Authentication challenge not found. Please try again.");
    }
    if (user.authNonce !== challenge) {
      console.error(`[Authorize] Nonce mismatch for user: ${user.id}`);
      throw new Error("Invalid authentication challenge.");
    }
    if (new Date() > user.nonceExpiry) {
      console.error(`[Authorize] Nonce expired for user: ${user.id}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { authNonce: null, nonceExpiry: null },
      });
      throw new Error("Authentication challenge expired. Please try again.");
    }
    console.log(`[Authorize] Nonce validated for user: ${user.id}`);

    // Step 4: EIP-1271 Signature Verification
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(process.env.RPC_URL!),
    });

    console.log(`[Authorize] Verifying EIP-1271 signature...`);
    let isSignatureValid = false;
    try {
      isSignatureValid = await publicClient.verifyMessage({
        address: walletAddress as Hex,
        message: challenge,
        signature: signedNonce as Hex,
      });
    } catch (verificationError) {
      console.error(`[Authorize] EIP-1271 verification failed:`, verificationError);
      throw new Error("Signature verification failed.");
    }

    if (!isSignatureValid) {
      console.error(`[Authorize] EIP-1271 Signature invalid for user: ${user.id}`);
      throw new Error("Invalid signature provided.");
    }
    console.log(`[Authorize] EIP-1271 Signature validated successfully.`);

    // Step 5: Check User Status
    if (!user.isActive) {
      console.warn(`[Authorize] Login attempt by inactive user: ${user.id}`);
      throw new Error("Your account is currently inactive.");
    }

    // Step 6: Success - Clear Nonce and Return User Object
    console.log(`[Authorize] Authorization successful for user: ${user.id}`);
    await prisma.user.update({
      where: { id: user.id },
      data: { authNonce: null, nonceExpiry: null },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };

  } catch (error: any) {
    console.error('[Authorize] Error during authorization process:', error);
    throw new Error(error.message || "An internal error occurred during authentication.");
  }
}
```

### Key Logic Points:

1. **Receive Credentials**:

   - Extracts `walletAddress`, `signedNonce`, and `challenge` from input
   - Validates presence of all required fields

2. **Nonce Lookup & User Retrieval**:

   - Fetches user record using `walletAddress`
   - Retrieves stored nonce details from database

3. **Nonce Validity Checks**:

   - Verifies nonce exists
   - Confirms it matches the challenge
   - Checks it hasn't expired
   - Clears expired nonces

4. **EIP-1271 Signature Verification**:

   - Core cryptographic verification step
   - Uses `viem`'s `publicClient.verifyMessage`
   - Handles smart contract wallet signatures
   - Implements EIP-1271 standard interface

5. **User Status Check**:

   - Ensures account is marked as active
   - Prevents login for disabled accounts

6. **Success Handling**:
   - Clears nonce to prevent replay attacks
   - Returns essential user information
   - Avoids returning sensitive data

### 6.2. Error Handling in authorize

The `authorize` function implements comprehensive error handling:

- **Return Values**:

  - `null`: Results in generic "invalid credentials" message
  - `throw Error`: Provides specific error messages
  - Used with `redirect: false` for custom frontend handling

- **Error Types**:

  - Missing credentials
  - User not found
  - Invalid/expired nonce
  - Failed signature verification
  - Inactive account
  - Internal errors

- **Error Propagation**:
  - Detailed error messages for frontend display
  - Comprehensive logging for debugging
  - Clean error state management

## 7. Addressing Complexity: Obtaining the Signing Client Post-Retrieval

### 7.1. Reiteration of the Challenge

A key point of potential confusion and friction in this direct SDK integration lies in the "Existing Account Login" flow (Section 5). The Cometh SDK function `retrieveAccountAddressFromPasskeys` successfully authenticates the user with their passkey and returns their associated smart wallet `walletAddress`, but it does not return an initialized `SmartAccountClient` instance capable of signing the subsequent nonce challenge.

### 7.2. Why the Difference?

The functions `createSafeSmartAccount` and `retrieveAccountAddressFromPasskeys` serve distinct purposes within the SDK:

- **createSafeSmartAccount**:

  - Designed to establish the full context for a smart wallet
  - When called without an address (Section 4), it:
    - Guides user through passkey creation
    - Prepares the `SafeSmartAccount` object
    - Encapsulates signer configuration
    - Includes chain details
    - Provides predicted address
  - This object is then used to create the `SmartAccountClient`

- **retrieveAccountAddressFromPasskeys**:
  - Primary goal is address lookup via passkey authentication
  - Confirms user possesses a valid passkey
  - Links to wallet managed by Cometh system
  - Returns corresponding address
  - Doesn't prepare full signing context

### 7.3. The Solution: Re-initialization

To bridge this gap in the login flow:

1. **Initial Authentication**:

   - Call `retrieveAccountAddressFromPasskeys`
   - Get the `walletAddress`

2. **Client Acquisition**:

   - Call `createSafeSmartAccount` again
   - Pass retrieved `walletAddress` in `smartAccountAddress` option
   - Leverages existing passkey authentication context
   - Initializes `SafeSmartAccount` for existing address

3. **Client Creation**:
   - Use new `smartAccount` object
   - Create `SmartAccountClient`
   - Ready for nonce signing

### 7.4. UX Implications

From a user's perspective:

- **First Interaction**:

  - Happens during `retrieveAccountAddressFromPasskeys`
  - Involves passkey interaction (biometric/security key)

- **Second Step**:
  - `createSafeSmartAccount` call
  - Should be transparent
  - Quick background operation
  - No additional user prompts
  - Relies on active passkey session

**Comparison with Higher-Level Solutions**:

- Two-step process vs single-step in wallet connectors
- Slight overhead in implementation
- Minor potential delay
- Requires careful error handling

**Table 2: SmartAccountClient Acquisition Comparison**

| Flow             | Initial SDK Call                    | Address Source                      | Client Acquisition Step(s)                                                                                     | Signing Capability Result       | Potential UX Impact                              |
| ---------------- | ----------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| Create Account   | `createSafeSmartAccount` (no addr)  | From returned `smartAccount` object | 1. `createSmartAccountClient(smartAccount)`                                                                    | Client ready after initial call | Single passkey prompt, seamless client setup     |
| Existing Account | `retrieveAccountAddressFromPasskey` | Returned directly by function       | 1. Call `createSafeSmartAccount({ smartAccountAddress })` <br/> 2. `createSmartAccountClient(newSmartAccount)` | Client ready after second call  | Single passkey prompt, extra background SDK call |

## 8. Managing Wagmi Coexistence

Many Web3 applications utilize Wagmi for managing wallet connections and interacting with smart contracts. Integrating the direct Cometh SDK authentication flow described here requires careful consideration to avoid conflicts with Wagmi's state management.

### 8.1. The Potential Conflict

Cometh Connect 4337 itself leverages Viem and is designed to integrate with Wagmi. Wagmi provides:

- Hooks like `useConnect`, `useDisconnect`, and `useAccount`
- Context provider (`WagmiProvider` or legacy `WagmiConfig`)
- Connection state management

When using the direct Cometh SDK calls coupled with NextAuth's `CredentialsProvider` for authentication, the application is essentially bypassing Wagmi's standard connection lifecycle management for the initial authentication phase.

### 8.2. Avoiding useConnect for Cometh Passkey Auth

It is strongly advised not to use Wagmi's `useConnect` hook to trigger the Cometh passkey authentication flows detailed in Sections 4 and 5. Attempting to wrap the `createSafeSmartAccount` or `retrieveAccountAddressFromPasskeys` logic within a custom Wagmi connector intended for `useConnect` can lead to complex state synchronization issues between:

- Cometh SDK's internal state
- NextAuth's session state
- Wagmi's connection state

The authentication mechanism described relies on NextAuth's `signIn` and the `CredentialsProvider` flow, which operates independently of Wagmi's `useConnect`.

### 8.3. NextAuth Session as Source of Truth

Once a user successfully signs in using the `cometh-credentials` provider, the NextAuth session becomes the primary indicator of the authenticated state:

```typescript
import { useSession } from 'next-auth/react';

function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "authenticated" && session?.user?.walletAddress) {
    return (
      <div>
        <p>Signed in as: {session.user.walletAddress}</p>
        {/* Display other user info */}
      </div>
    );
  }

  return <p>Not signed in.</p>;
}
```

### 8.4. Using Wagmi Post-Authentication

Wagmi can still be valuable for blockchain interactions after the user has authenticated via the NextAuth/Cometh SDK flow:

- **Available Hooks**:

  - `useReadContract`
  - `useWriteContract`
  - Viem actions through Wagmi-configured client

- **Key Consideration**:
  - Base interactions on NextAuth session state
  - Not necessarily Wagmi's `useAccount` hook
  - Address might match if configured correctly

### 8.5. Potential Wagmi Initialization Post-Auth

While this report focuses on NextAuth integration, if Wagmi is needed for subsequent interactions, its configuration needs careful management:

1. **Setting up Wagmi**:

   - Configure Wagmi (`createConfig`) with necessary chains and transports
   - Avoid relying on built-in connectors for Cometh passkey flow

2. **Using Viem Clients**:
   - Leverage Viem clients directly for interactions
   - `PublicClient` can be created easily
   - For write operations, use `SmartAccountClient` from authentication flow
   - Store client securely (React context/state)
   - Re-instantiate when needed using `walletAddress` from NextAuth session

## 9. Conclusion & Recommendations

### 9.1. Summary of Integration

This report has detailed a method for integrating Cometh Connect 4337's passkey-based smart wallet authentication directly into a Next.js application using NextAuth.js. The core components involve:

1. **NextAuth Configuration**:

   - `CredentialsProvider` setup
   - Database adapter integration
   - JWT session strategy

2. **Backend Infrastructure**:

   - Secure nonce generation API
   - Storage linked to `walletAddress`

3. **Frontend Flows**:

   - New account creation (`createSafeSmartAccount`)
   - Existing account login (`retrieveAccountAddressFromPasskeys`)

4. **Security Measures**:

   - EIP-1271 signature verification
   - Robust nonce management
   - Comprehensive error handling

5. **State Management**:
   - Clear authentication flow
   - Careful client acquisition
   - Wagmi coexistence strategy

### 9.2. Benefits Revisited

Successfully implementing this pattern offers significant advantages:

- **Enhanced Security**:

  - Phishing resistance
  - Passkey (WebAuthn) protection
  - Smart contract wallet security

- **Improved UX**:

  - No seed phrases
  - Potential gasless transactions
  - Simplified onboarding

- **Developer Control**:
  - Granular authentication control
  - Custom UI integration
  - Flexible error handling

### 9.3. Key Considerations & Best Practices

1. **SDK Version**:

   - Use `@cometh/connect-sdk-4337`
   - Keep updated with latest releases

2. **NextAuth Strategy**:

   - Use JWT session strategy
   - Understand adapter role
   - Manage session state correctly

3. **EIP-1271 Verification**:

   - Use `viem.publicClient.verifyMessage`
   - Handle smart contract signatures
   - Implement proper error handling

4. **Login Flow**:

   - Handle two-step client acquisition
   - Manage passkey context
   - Provide clear user feedback

5. **Wagmi Integration**:

   - Avoid `useConnect` for auth
   - Use NextAuth session as source of truth
   - Configure post-authentication

6. **Security Practices**:
   - Implement secure nonces
   - Clear after use
   - Rate limit endpoints
   - Use HTTPS

### 9.4. Future Considerations

The landscape of Account Abstraction and passkey integration continues to evolve:

- **Potential Updates**:

  - Cometh Connect SDK improvements
  - ERC-4337 advancements
  - EIP-1271 and EIP-6492 developments

- **Areas to Watch**:

  - Client acquisition simplification
  - Wagmi integration improvements
  - New security standards

- **Development Focus**:
  - Stay updated with documentation
  - Monitor AA ecosystem
  - Adapt to new best practices

## References

1. [Signature Verification - Base Docs](https://docs.base.org/identity/smart-wallet/guides/signature-verification)
2. [EIP-1271: Signature Verification for Smart Contract Wallets - Dynamic.xyz](https://www.dynamic.xyz/blog/eip-1271)
3. [Retrieve a wallet address | Connect 4337](https://docs.cometh.io/connect-4337/core-features/retrieve-a-wallet-address)
4. [Create a Wallet | Connect 4337](https://docs.cometh.io/connect-4337/core-features/create-a-wallet)
5. [@cometh/connect-sdk-4337 - npm](https://www.npmjs.com/package/@cometh/connect-sdk-4337)
6. [Session Keys | Connect 4337](https://docs.cometh.io/connect-4337/sdk-features/session-keys-alpha-release)
7. [verifyMessage - Viem](https://viem.sh/docs/actions/public/verifyMessage.html)
8. [ambire/signature-validator - NPM](https://www.npmjs.com/package/@ambire/signature-validator)
9. [Viem | Wagmi](https://wagmi.sh/core/guides/viem)
10. [cometh-hq/connect-sdk-4337 - GitHub](https://github.com/cometh-hq/connect-sdk-4337)
