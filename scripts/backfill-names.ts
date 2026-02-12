import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    where: { firstName: null },
  });

  console.log(`Found ${patients.length} patients to backfill`);

  for (const patient of patients) {
    const parts = patient.name.trim().split(/\s+/);
    const firstName = parts[0] || patient.name;
    const lastName = parts.slice(1).join(" ") || "";

    await prisma.patient.update({
      where: { id: patient.id },
      data: { firstName, lastName },
    });

    console.log(`  Updated: ${patient.name} → "${firstName}" "${lastName}"`);
  }

  console.log("Backfill complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
