import { prisma } from "./client";

export async function getRoundPhases() {
  return prisma.roundPhase.findMany({
    orderBy: {
      startDate: "asc",
    },
  });
}
