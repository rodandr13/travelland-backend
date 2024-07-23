import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'ADMIN', description: 'Administrator role' },
    {
      name: 'USER',
      description: 'User role',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const permissions = [
    { name: 'READ', description: 'Read permission' },
    { name: 'WRITE', description: 'Write permission' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  const readPermission = await prisma.permission.findUnique({
    where: { name: 'READ' },
  });
  const writePermission = await prisma.permission.findUnique({
    where: { name: 'WRITE' },
  });

  if (adminRole && userRole && readPermission && writePermission) {
    await prisma.rolePermission.createMany({
      data: [
        { role_id: adminRole.id, permission_id: readPermission.id },
        { role_id: adminRole.id, permission_id: writePermission.id },
        { role_id: userRole.id, permission_id: readPermission.id },
      ],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
