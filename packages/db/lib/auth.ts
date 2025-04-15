import { prisma, User } from "./client";
import { Prisma } from "@prisma/client"; // Import Prisma namespace

type NonceData = {
  nonce: string;
  expiresAt: Date;
};

// Function to get user by wallet address, including nonce fields
export function getUserWithNonce(walletAddress: string): Promise<User | null> {
  // Ensure walletAddress is not null/undefined before querying
  if (!walletAddress) {
    return Promise.resolve(null);
  }
  return prisma.user.findUnique({
    where: {
      walletAddress: walletAddress, // Use walletAddress field
    },
  });
}

export function createUser(walletAddress: string): Promise<User> {
  if (!walletAddress) {
    throw new Error("Wallet address cannot be empty");
  }
  return prisma.user.create({
    data: {
      walletAddress: walletAddress,
      // Add other default fields if necessary
      isActive: true,
    },
  });
}

// Function to update a user's nonce and expiry
export function updateUserNonce(
  userId: string,
  nonceData: NonceData
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      nonce: nonceData.nonce,
      nonceExpiry: nonceData.expiresAt,
    },
  });
}

// Upsert function similar to the guide's nonce endpoint logic
export function upsertUserWithNonce(
  walletAddress: string,
  nonceData: NonceData
): Promise<User> {
  if (!walletAddress) {
    throw new Error("Wallet address cannot be empty");
  }
  return prisma.user.upsert({
    where: { walletAddress: walletAddress },
    update: {
      nonce: nonceData.nonce,
      nonceExpiry: nonceData.expiresAt,
    },
    create: {
      walletAddress: walletAddress,
      nonce: nonceData.nonce,
      nonceExpiry: nonceData.expiresAt,
      isActive: true,
    },
  });
}

// Function to clear a user's nonce after successful authentication
export function clearUserNonce(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      nonce: null,
      nonceExpiry: null,
    },
  });
}
