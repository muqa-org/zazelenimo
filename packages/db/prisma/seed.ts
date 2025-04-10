import { prisma } from "../lib/client";
import seedRoundPhases from "./seeds/round-phases";

const alwaysRunSeeds = [seedRoundPhases];

const nonCISeeds: (() => Promise<void>)[] = [
  // Add any seeds that should not run in CI environment
];

async function seed() {
  const seedsToRun = [...alwaysRunSeeds];

  if (!process.env.CI) {
    seedsToRun.push(...nonCISeeds);
  }

  for (const seedFn of seedsToRun) {
    await seedFn();
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
