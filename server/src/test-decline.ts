import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    // Create another application to test decline
    const app2 = await prisma.application.create({
      data: {
        job_id: 1,
        candidate_id: 2,
        status: 'pending'
      }
    });
    console.log('Created test application 2:', app2.application_id);

    // Update it to rejected to trigger notification
    const updated = await prisma.application.update({
      where: { application_id: app2.application_id },
      data: { status: 'rejected' }
    });
    console.log('Updated application to rejected status');

    // Give server time to create notification
    await new Promise(r => setTimeout(r, 1000));

    // Fetch all notifications for candidate
    const notif = await prisma.notification.findMany({
      where: { user_id: 2 },
      orderBy: { created_at: 'desc' }
    });
    console.log('Notifications:', JSON.stringify(notif, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
