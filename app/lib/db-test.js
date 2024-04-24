const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();

  try {
    // Test a simple query to check database connectivity
    const latestInvoices = await prisma.invoices.findMany({
      select: {
        amount: true,
        customer: {
          select: {
            name: true,
            imageUrl: true,
            email: true,
          },
        },
        id: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });
    console.log('Database connection successful!');
    console.log('Fetched users:', latestInvoices);
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
