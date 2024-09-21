import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: RoleName.ADMIN, description: 'Administrator role' },
    { name: RoleName.AGENCY_USER, description: 'Agency user role' },
    { name: RoleName.USER, description: 'Registered user role' },
    { name: RoleName.GUEST, description: 'Guest user role' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const permissions = [
    { name: 'VIEW_SERVICES', description: 'Просмотр' },
    { name: 'BOOK_SERVICES', description: 'Бронирование' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: RoleName.ADMIN },
  });
  const userRole = await prisma.role.findUnique({
    where: { name: RoleName.USER },
  });
  const guestRole = await prisma.role.findUnique({
    where: { name: RoleName.GUEST },
  });
  const agencyRole = await prisma.role.findUnique({
    where: { name: RoleName.AGENCY_USER },
  });

  const viewServicesPermission = await prisma.permission.findUnique({
    where: { name: 'VIEW_SERVICES' },
  });
  const bookServicesPermission = await prisma.permission.findUnique({
    where: { name: 'BOOK_SERVICES' },
  });

  if (
    adminRole &&
    userRole &&
    guestRole &&
    agencyRole &&
    viewServicesPermission &&
    bookServicesPermission
  ) {
    await prisma.rolePermission.createMany({
      data: [
        { role_id: adminRole.id, permission_id: viewServicesPermission.id },
        { role_id: adminRole.id, permission_id: bookServicesPermission.id },
        { role_id: userRole.id, permission_id: viewServicesPermission.id },
        { role_id: userRole.id, permission_id: bookServicesPermission.id },
        { role_id: guestRole.id, permission_id: viewServicesPermission.id },
        { role_id: agencyRole.id, permission_id: viewServicesPermission.id },
        { role_id: agencyRole.id, permission_id: bookServicesPermission.id },
      ],
      skipDuplicates: true,
    });
  } else {
    console.error('Не удалось найти необходимые роли или пермишены');
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
