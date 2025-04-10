import { prisma } from "../../lib/client";

const roundPhases = [
  {
    title: "Application",
    startDate: new Date("2024-08-19T12:00:00"),
    endDate: new Date("2024-09-02T12:00:00"),
  },
  {
    title: "Donation",
    startDate: new Date("2024-09-16T12:00:00"),
    endDate: new Date("2024-09-30T12:00:00"),
  },
  {
    title: "Votes",
    startDate: new Date("2024-10-01T12:00:00"),
    endDate: new Date("2024-10-10T12:00:00"),
  },
  {
    title: "Results",
    startDate: new Date("2024-10-15T12:00:00"),
    endDate: new Date("2024-11-30T12:00:00"),
  },
];

export default async function seedRoundPhases() {
  const existingPhases = await prisma.roundPhase.findMany();
  if (existingPhases.length > 0) {
    console.log("Round phases already exist. Skipping seed.");
    return;
  }

  console.log("Seeding round phases...");
  for (const phase of roundPhases) {
    await prisma.roundPhase.create({
      data: phase,
    });
  }
}
