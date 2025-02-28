import { prisma, User, AuthNonce, Account } from "./client";
import { Prisma } from "@prisma/client";

type GeneratedNonceData = {
  nonce: string;
  expiresAt: Date;
};

export async function getUserWithNonce(
  address: string
): Promise<User & { authNonce: AuthNonce | null }> {
  return prisma.user.findFirst({
    where: {
      address,
    },
    include: { authNonce: true },
  }) as Promise<User & { authNonce: AuthNonce | null }>;
}

export async function createUserWithNonce(
  address: string,
  nonceData: GeneratedNonceData
): Promise<User> {
  return prisma.user.create({
    data: {
      address,
      authNonce: {
        create: nonceData,
      },
    },
  });
}

export async function upsertUserNonce(
  user: User,
  { nonce, expiresAt }: GeneratedNonceData
): Promise<AuthNonce> {
  const data = { userId: user.id, nonce, expiresAt };
  return prisma.authNonce.upsert({
    where: { userId: user.id },
    create: data,
    update: data,
  });
}

export async function deleteUserNonce(user: User): Promise<AuthNonce> {
  return prisma.authNonce.delete({
    where: { userId: user.id },
  });
}

export async function createOrUpdateUserAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
  accessToken?: string
): Promise<Account> {
  return prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: {
      access_token: accessToken,
      updatedAt: new Date(),
    },
    create: {
      userId,
      type: "credentials",
      provider,
      providerAccountId,
      access_token: accessToken,
    },
  });
}

export async function getUserByAddress(
  address: string
): Promise<(User & { accounts: Account[] }) | null> {
  return prisma.user.findUnique({
    where: { address },
    include: {
      accounts: true,
    },
  });
}
