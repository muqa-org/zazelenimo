import { prisma, User, AuthNonce } from "./client";

type generatedNonceData = {
  nonce: string;
  expiresAt: Date;
};

export function getUserWithNonce(address: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      address,
    },
    include: { authNonce: true },
  });
}

export function createUserWithNonce(
  address: string,
  nonceData: generatedNonceData,
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

export function upsertUserNonce(
  user: User,
  nonceData: generatedNonceData,
): Promise<AuthNonce> {
  const { nonce, expiresAt } = nonceData;
  const data = { userId: user.id, nonce, expiresAt };
  return prisma.authNonce.upsert({
    where: { userId: user.id },
    create: data,
    update: data,
  });
}

export function deleteUserNonce(user: User): Promise<AuthNonce> {
  return prisma.authNonce.delete({
    where: { userId: user.id },
  });
}
