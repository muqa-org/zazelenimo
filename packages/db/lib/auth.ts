import { prisma, User } from "./client";

type generatedNonceData = {
  nonce: string;
  expiresAt: Date;
};

export function getUserWithNonce(address: string) {
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
) {
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
  { nonce, expiresAt }: generatedNonceData,
) {
  const data = { userId: user.id, nonce, expiresAt };
  return prisma.authNonce.upsert({
    where: { userId: user.id },
    create: data,
    update: data,
  });
}

export function deleteUserNonce(user: User) {
  return prisma.authNonce.delete({
    where: { userId: user.id },
  });
}
