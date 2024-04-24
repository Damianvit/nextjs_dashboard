import { PrismaClient } from '@prisma/client';
import { formatCurrency } from './utils';

const prisma = new PrismaClient();

export async function fetchRevenue() {
  try {
    // Fetch all revenue data using Prisma
    const data = await prisma.revenue.findMany();
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const latestInvoices = await prisma.invoice.findMany({
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

    // Assuming formatCurrency is a function you define elsewhere
    latestInvoices.forEach((invoice) => {
      invoice.amount = formatCurrency(invoice.amount);
    });

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}
export async function fetchCardData() {
  try {
    // Execute multiple queries in parallel using Prisma
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      prisma.invoices.count(),
      prisma.customers.count(),
      prisma.invoices.aggregate({
        _sum: {
          amount: true,
        },
        _where: {
          status: 'paid',
        },
      }),
    ]);

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices: formatCurrency(invoiceStatus._sum.amount ?? 0),
      // Add logic for pending invoices if needed
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Use Prisma's query methods to filter and paginate invoices
    const invoices = await prisma.invoices.findMany({
      where: {
        OR: [
          {
            customers: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          // Add other conditions for email, amount, date, and status
        ],
      },
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: {
        date: 'desc',
      },
      include: {
        customers: true, // Adjust according to your schema
      },
    });

    // Map and format the results
    return invoices.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
      // Include customer details
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    // Calculate the total number of pages for the filtered invoices
    const count = await prisma.invoices.count({
      where: {
        OR: [
          // Add conditions similar to fetchFilteredInvoices
        ],
      },
    });

    return Math.ceil(count / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    // Fetch a single invoice by ID using Prisma
    const invoice = await prisma.invoices.findUnique({
      where: { id },
      // Include related customer data if needed
    });

    return {
      ...invoice,
      amount: invoice.amount / 100, // Convert amount if necessary
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    // Fetch all customers ordered by name using Prisma
    const customers = await prisma.customers.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return customers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    // Use Prisma's query methods to filter customers and aggregate invoice data
    const customers = await prisma.customers.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    // Map and format the results
    return customers.map((customer) => {
      const totalInvoices = customer.invoices.length;
      const totalPending = customer.invoices.reduce((acc, invoice) => {
        return invoice.status === 'pending' ? acc + invoice.amount : acc;
      }, 0);
      const totalPaid = customer.invoices.reduce((acc, invoice) => {
        return invoice.status === 'paid' ? acc + invoice.amount : acc;
      }, 0);

      return {
        ...customer,
        total_invoices: totalInvoices,
        total_pending: formatCurrency(totalPending),
        total_paid: formatCurrency(totalPaid),
      };
    });
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    // Fetch a single user by email using Prisma
    const user = await prisma.users.findUnique({
      where: { email },
    });

    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
