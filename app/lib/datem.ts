// import statements for PrismaClient and utilities

import { PrismaClient } from '@prisma/client';
import { formatCurrency } from './utils';

const prisma = new PrismaClient();

export async function fetchRevenue() {
  try {
    const revenueData = await prisma.revenue.findMany();
    return revenueData;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
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
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      prisma.invoice.count(),
      prisma.customer.count(),
      prisma.invoice.aggregate({
        sum: {
          amount: true,
        },
        where: {
          status: {
            in: ['paid', 'pending'],
          },
        },
      }),
    ]);

    const totalPaidInvoices = formatCurrency(invoiceStatus.sum.amount ?? '0');
    const totalPendingInvoices = formatCurrency(
      invoiceStatus.sum.amount ?? '0'
    );

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(query, currentPage) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const filteredInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        status: true,
        customer: {
          select: {
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      where: {
        OR: [
          { customer: { name: { contains: query } } },
          { customer: { email: { contains: query } } },
          { amount: { contains: query } },
          { date: { contains: query } },
          { status: { contains: query } },
        ],
      },
      orderBy: {
        date: 'desc',
      },
      take: ITEMS_PER_PAGE,
      skip: offset,
    });

    return filteredInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query) {
  try {
    const count = await prisma.invoice.count({
      where: {
        OR: [
          { customer: { name: { contains: query } } },
          { customer: { email: { contains: query } } },
          { amount: { contains: query } },
          { date: { contains: query } },
          { status: { contains: query } },
        ],
      },
    });

    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        customerId: true,
        amount: true,
        status: true,
      },
    });

    // Assuming formatCurrency is a function you define elsewhere
    invoice.amount = formatCurrency(invoice.amount);

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
      },
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

export async function fetchFilteredCustomers(query) {
  try {
    const filteredCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        invoices: {
          where: {
            status: {
              in: ['pending', 'paid'],
            },
          },
          _count: true,
          _sum: {
            amount: true,
          },
        },
      },
      where: {
        OR: [{ name: { contains: query } }, { email: { contains: query } }],
      },
      orderBy: {
        name: 'asc',
      },
      groupBy: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
      },
    });

    filteredCustomers.forEach((customer) => {
      customer.invoices.totalPending = formatCurrency(
        customer.invoices._sum.amount ?? '0'
      );
      customer.invoices.totalPaid = formatCurrency(
        customer.invoices._sum.amount ?? '0'
      );
    });

    return filteredCustomers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
