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
│   ├── layout.tsx
│   └── page.tsx             # Main application page
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

import NextAuth, { type NextAuthOptions, type Session, type User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http, Hex } from 'viem';
import { arbitrumSepolia } from 'viem/chains'; // Use your target chain

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
    strategy: 'jwt',
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
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### Session Strategy Explanation

A critical aspect of using `CredentialsProvider` is the session strategy. NextAuth.js documentation and common practice indicate that `CredentialsProvider` is designed to work primarily with the `jwt` session strategy. Even when a database adapter (like `PrismaAdapter`) is configured, the adapter's role shifts when `CredentialsProvider` is the means of authentication.

Instead of storing the session itself in the database (as it would with OAuth providers using the database strategy), the adapter is primarily used here to persist user data (like `walletAddress`, `name`, etc.) and potentially related authentication artifacts like the `authNonce`. The session state itself is managed via a JSON Web Token (JWT) stored in a cookie.

This distinction is important: developers accustomed to OAuth flows with database adapters might expect automatic session persistence in the DB. With `CredentialsProvider`, the JWT holds the session information, and the `jwt` and `session` callbacks become essential for enriching this token and exposing the necessary user data (fetched from the database via the adapter or included in the token) to the client-side `useSession` hook.

**Table 1: Session Strategy Implications with NextAuth Providers**

| Provider Type | Session Strategy | Database Adapter Role | Key Callbacks for Custom Data | Pros | Cons |
|--------------|------------------|----------------------|------------------------------|------|------|
| OAuth (e.g., Google) | database (Default) | Persists User, Account, Session data | session (receives DB user) | Stateless server (session in DB), automatic session handling | Requires DB connection for session checks |
| Credentials | jwt (Required) | Persists User data (e.g., walletAddress, nonce) | authorize, jwt, session | Works without DB for sessions, flexible auth logic in authorize | Requires JWT strategy, manual data propagation via callbacks, JWT size limits |
| Credentials | database (Not Rec.) | Not standard; requires complex manual session handling | signIn, session | Allows DB sessions | Against NextAuth design for Credentials, complex, error-prone |

This table clarifies why the `jwt` strategy is mandated for the `CredentialsProvider` flow described in this report, even with a database adapter present. The adapter handles user and nonce data, while JWT manages the session state, requiring careful implementation of the `jwt` and `session` callbacks to pass necessary data like `userId` and `walletAddress` to the client.

### 3.2. Implementing the Nonce API Endpoint (/api/auth/nonce)

This backend API route is responsible for generating and storing the cryptographic nonce used in the challenge-response flow:

```typescript
// app/api/auth/nonce/route.ts (or pages/api/auth/nonce.ts)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const NONCE_EXPIRY_MINUTES = 5; // Set nonce validity duration

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
      return NextResponse.json(
        { message: 'Invalid wallet address provided' },
        { status: 400 }
      );
    }

    // 1. Generate Secure Nonce
    const nonce = crypto.randomBytes(32).toString('hex');

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
    console.error('Nonce generation error:', error);
    return NextResponse.json(
      { message: 'Internal server error during nonce generation' },
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