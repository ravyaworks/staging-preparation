import { getPrismaClient, disconnectPrisma } from '@conversation-platform/database';
import { hashPassword } from '@conversation-platform/auth';

const RESOURCES = [
  'user', 'tenant', 'role', 'permission', 'settings',
  'audit', 'api_key', 'file', 'webhook', 'event', 'notification',
] as const;

const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'] as const;

async function seed(): Promise<void> {
  const prisma = getPrismaClient();

  try {
    const existingPermissions = await prisma.permission.count();
    if (existingPermissions > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    const permissions: { id: string; slug: string }[] = [];

    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const perm = await prisma.permission.create({
          data: {
            name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.replace('_', ' ')}`,
            slug: `${resource}:${action}`,
            description: `Allows ${action} operation on ${resource.replace('_', ' ')}`,
            resource,
            action,
          },
        });
        permissions.push(perm);
      }
    }

    console.log(`Created ${permissions.length} permissions`);

    const superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Full system access across all tenants',
        isSystem: true,
      },
    });

    for (const perm of permissions) {
      await prisma.rolePermission.create({
        data: { roleId: superAdminRole.id, permissionId: perm.id },
      });
    }

    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        slug: 'admin',
        description: 'Tenant-level administrative access',
        isSystem: true,
      },
    });

    for (const perm of permissions) {
      await prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: perm.id },
      });
    }

    await prisma.role.create({
      data: {
        name: 'Member',
        slug: 'member',
        description: 'Standard user with basic access',
        isSystem: true,
      },
    });

    await prisma.role.create({
      data: {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access',
        isSystem: true,
      },
    });

    console.log('Created system roles');

    const adminTenant = await prisma.tenant.create({
      data: {
        name: 'Default Admin Tenant',
        slug: 'admin',
        settings: { allowRegistration: true, maxUsersPerOrg: 100 },
      },
    });

    console.log('Created admin tenant:', adminTenant.slug);

    const passwordHash = await hashPassword('Admin123!');

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@conversation-platform.com',
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
        isVerified: true,
        tenantId: adminTenant.id,
      },
    });

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: superAdminRole.id },
    });

    console.log('Admin user: admin@conversation-platform.com / Admin123!');
    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

seed();
