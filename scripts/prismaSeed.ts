import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  invoices,
  customers,
  revenue,
  users,
} from '../app/lib/placeholder-data';
import { Customer, Invoice, User, Revenue } from '../app/lib/definitions';

const prisma = new PrismaClient();

async function seedUsers(): Promise<User[]> {
  // Ensure "uuid-ossp" extension is enabled

  try {
    // Insert data into the "users" table
    const insertedUsers = await Promise.all(
      users.map(async (user: User) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            password: hashedPassword,
          },
          skipDuplicates: true as boolean,
        });
      })
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return insertedUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices(): Promise<Invoice[]> {
  try {
    // Ensure "uuid-ossp" extension is enabled

    const insertedInvoices = await Promise.all(
      invoices.map(async (invoice: Invoice) => {
        try {
          const insertedInvoice = await prisma.invoice.create({
            data: {
              customerId: invoice.customer_id,
              amount: invoice.amount,
              status: invoice.status,
              date: invoice.date,
            },
            // Handle conflict if needed
            // Example: On conflict do nothing
            // Alternatively, you can use other actions like update or error
            onConflict: {
              where: { id: invoice.id },
              // action: 'update', // Uncomment to perform update on conflict
              // action: 'error', // Uncomment to throw error on conflict
            },
          });
          return insertedInvoice;
        } catch (error) {
          console.error('Error inserting invoice:', error);
          return null;
        }
      })
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);

    return insertedInvoices;
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers(): Promise<Customer[]> {
  try {
    // Ensure "uuid-ossp" extension is enabled

    const insertedCustomers = await Promise.all(
      customers.map(async (customer: Customer) => {
        try {
          const insertedCustomer = await prisma.customer.create({
            data: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              imageUrl: customer.image_url,
            },
            onConflict: {
              where: { id: customer.id },
              // action: 'update', // Uncomment to perform update on conflict
              // action: 'error', // Uncomment to throw error on conflict
            },
          });
          return insertedCustomer;
        } catch (error) {
          console.error('Error inserting customer:', error);
          return null;
        }
      })
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return insertedCustomers;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue(): Promise<Revenue[]> {
  try {
    const insertedRevenue = await Promise.all(
      revenue.map(async (rev: Revenue) => {
        try {
          const inserted = await prisma.revenue.create({
            data: {
              month: rev.month,
              revenue: rev.revenue,
            },
            // Handle conflict if needed
            // Example: On conflict do nothing
            // Alternatively, you can use other actions like update or error
            // onConflict: {
            //   target: ['month'],
            //   action: 'update',
            // },
          });
          return inserted;
        } catch (error) {
          console.error('Error inserting revenue:', error);
          return null;
        }
      })
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return insertedRevenue;
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedUsers();
  } catch (error) {
    console.error(
      'An error occurred while attempting to seed the database:',
      error
    );
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma Client
  }
}

main();
