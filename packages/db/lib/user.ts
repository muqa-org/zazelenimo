import { prisma, User } from './client';

export function getUser(user: User) {
  return prisma.user.findUnique({
    where: {
      id: user.id
    },
  });
}


export function updateUser(user: User, data: Partial<User>) {
  return prisma.user.update({
    where: {
      id: user.id
    },
    data,
  });
}
