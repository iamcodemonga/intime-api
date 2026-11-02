import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const permissions = [
  {
    sn: 1,
    code: "inspectors.read",
    name: "Read inspectors",
    module: "inspectors",
    description: "View inspector accounts and memberships",
  },
  {
    sn: 2,
    code: "inspectors.manage",
    name: "Manage inspectors",
    module: "inspectors",
    description: "Create and update inspectors",
  },
  {
    sn: 3,
    code: "centers.read",
    name: "Read centers",
    module: "centers",
    description: "View inspection centers",
  },
  {
    sn: 4,
    code: "centers.manage",
    name: "Manage centers",
    module: "centers",
    description: "Create and update inspection centers",
  },
  {
    sn: 5,
    code: "reports.read",
    name: "Read reports",
    module: "reports",
    description: "View inspection reports",
  },
  {
    sn: 6,
    code: "reports.manage",
    name: "Manage reports",
    module: "reports",
    description: "Create and update inspection reports",
  },
] as const;

async function main() {
  for (const permission of permissions) {
    await prisma.systemPermission.upsert({
      where: { code: permission.code },
      create: permission,
      update: {
        sn: permission.sn,
        name: permission.name,
        module: permission.module,
        description: permission.description,
      },
    });
  }

  const adminRole = await prisma.systemRole.upsert({
    where: { name: "admin" },
    create: {
      name: "admin",
      description: "System administrator",
      systemRole: true,
    },
    update: {
      description: "System administrator",
      systemRole: true,
    },
  });

  const inspectorRole = await prisma.systemRole.upsert({
    where: { name: "inspector" },
    create: {
      name: "inspector",
      description: "Inspection center operator",
      systemRole: true,
    },
    update: {
      description: "Inspection center operator",
      systemRole: true,
    },
  });

  const allPermissions = await prisma.systemPermission.findMany();
  const byCode = Object.fromEntries(allPermissions.map((p) => [p.code, p]));

  const adminCodes = allPermissions.map((p) => p.code);
  const inspectorCodes = [
    "centers.read",
    "reports.read",
    "reports.manage",
  ] as const;

  for (const code of adminCodes) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: byCode[code].id,
        },
      },
      create: {
        roleId: adminRole.id,
        permissionId: byCode[code].id,
      },
      update: {},
    });
  }

  for (const code of inspectorCodes) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: inspectorRole.id,
          permissionId: byCode[code].id,
        },
      },
      create: {
        roleId: inspectorRole.id,
        permissionId: byCode[code].id,
      },
      update: {},
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
