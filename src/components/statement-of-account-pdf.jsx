import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Helper function to format date
const fDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper function to format date time
const fDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to format currency
const fCurrency = (amount, currency = 'AED') => {
  const value = Number(amount || 0);
  return `${value.toFixed(2)} ${currency}`;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #000',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  rowLabel: {
    fontSize: 9,
    width: 120,
    fontWeight: 'bold',
  },
  rowValue: {
    fontSize: 9,
    flex: 1,
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderBottom: '1 solid #000',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #ccc',
  },
  tableCell: {
    fontSize: 8,
  },
  col1: { width: '10%' }, // Date
  col2: { width: '15%' }, // Ref/ID
  col3: { width: '35%' }, // Description
  col4: { width: '15%' }, // Debit
  col5: { width: '15%' }, // Credit
  col6: { width: '10%' }, // Balance
  summarySection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    border: '1 solid #000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1 solid #ccc',
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
  },
});

export const StatementOfAccountPDF = ({ agent, bookings, walletTransactions, logoUrl }) => {
  if (!agent) return null;

  // Get name
  const agentName = `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'User';
  const agentEmail = agent.email || 'N/A';
  const agentPhone = agent.phone || 'N/A';
  
  // Current balance
  const currentBalance = agent.agentProfile?.walletBalance || 0;
  const currency = agent.agentProfile?.preferredCurrency || 'AED';

  // Generate statement period
  const statementDate = fDate(new Date());
  let statementPeriod = 'All Time';
  
  if (bookings && bookings.length > 0) {
    const dates = bookings
      .map(b => b.createdAt)
      .filter(d => d)
      .sort((a, b) => new Date(a) - new Date(b));
    
    if (dates.length > 0) {
      const startDate = fDate(dates[0]);
      const endDate = fDate(dates[dates.length - 1]);
      statementPeriod = `${startDate} to ${endDate}`;
    }
  }

  // Combine bookings and wallet transactions into a single timeline
  const transactions = [];

  // Add bookings as transactions
  if (bookings && bookings.length > 0) {
    bookings.forEach((booking) => {
      const bookingDate = booking.createdAt || booking.createdAt;
      const bookingAmount = booking.totalAmount || 0;
      const bookingRef = booking.bookingId || 'N/A';
      
      // Get booking description
      let description = `Booking ${bookingRef}`;
      if (booking.bookingType === 'PRODUCT' && booking.productItems?.[0]) {
        const productName = booking.productItems[0]?.product?.title || booking.productItems[0]?.title || 'Product';
        description = `Booking ${bookingRef} - ${productName}`;
      } else if (booking.bookingType === 'PACKAGE' && booking.packageItem) {
        const packageName = booking.packageItem?.package?.title || booking.packageItem?.title || 'Package';
        description = `Booking ${bookingRef} - ${packageName}`;
      } else if (booking.bookingType === 'TICKET' && booking.ticketItems?.[0]) {
        const ticketName = booking.ticketItems[0]?.ticket?.title || booking.ticketItems[0]?.title || 'Ticket';
        description = `Booking ${bookingRef} - ${ticketName}`;
      }

      // If paid with credits, it's a debit from wallet
      if (booking.payment?.credits?.amount > 0) {
        transactions.push({
          date: bookingDate,
          ref: bookingRef,
          description: `${description} (Credits Payment)`,
          debit: booking.payment.credits.amount,
          credit: 0,
          type: 'booking_debit',
        });
      } else {
        // Regular booking (not using credits)
        transactions.push({
          date: bookingDate,
          ref: bookingRef,
          description: description,
          debit: 0,
          credit: 0,
          type: 'booking',
        });
      }
    });
  }

  // Add wallet transactions
  if (walletTransactions && walletTransactions.length > 0) {
    walletTransactions.forEach((transaction) => {
      transactions.push({
        date: transaction.createdAt,
        ref: transaction.transactionId || 'N/A',
        description: transaction.note || (transaction.type === 'DEBIT' ? 'Debit Transaction' : 'Credit Transaction'),
        debit: transaction.type === 'DEBIT' ? transaction.amount : 0,
        credit: transaction.type === 'CREDIT' ? transaction.amount : 0,
        type: transaction.type.toLowerCase(),
      });
    });
  }

  // Sort transactions by date (oldest first)
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = transactions.map((tx) => {
    runningBalance = runningBalance + tx.credit - tx.debit;
    return {
      ...tx,
      balance: runningBalance,
    };
  });

  // Calculate totals
  const totalDebits = transactions.reduce((sum, tx) => sum + (tx.debit || 0), 0);
  const totalCredits = transactions.reduce((sum, tx) => sum + (tx.credit || 0), 0);
  const totalBookings = bookings?.length || 0;
  const totalBookingAmount = bookings?.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}
          <Text style={styles.companyName}>Statement of Account</Text>
          <Text style={styles.documentTitle}>Account Statement</Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name:</Text>
            <Text style={styles.rowValue}>{agentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email:</Text>
            <Text style={styles.rowValue}>{agentEmail}</Text>
          </View>
          {agentPhone !== 'N/A' && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Phone:</Text>
              <Text style={styles.rowValue}>{agentPhone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Statement Date:</Text>
            <Text style={styles.rowValue}>{statementDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Statement Period:</Text>
            <Text style={styles.rowValue}>{statementPeriod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current Balance:</Text>
            <Text style={[styles.rowValue, { fontWeight: 'bold' }]}>
              {fCurrency(currentBalance, currency)}
            </Text>
          </View>
        </View>

        {/* Transaction Table */}
        {transactionsWithBalance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>Date</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Reference</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>Description</Text>
                <Text style={[styles.tableHeaderCell, styles.col4]}>Debit</Text>
                <Text style={[styles.tableHeaderCell, styles.col5]}>Credit</Text>
                <Text style={[styles.tableHeaderCell, styles.col6]}>Balance</Text>
              </View>
              {/* Table Rows */}
              {transactionsWithBalance.map((tx, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.col1]}>{fDate(tx.date)}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{tx.ref}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>{tx.description}</Text>
                  <Text style={[styles.tableCell, styles.col4]}>
                    {tx.debit > 0 ? fCurrency(tx.debit, currency) : '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.col5]}>
                    {tx.credit > 0 ? fCurrency(tx.credit, currency) : '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.col6]}>
                    {fCurrency(tx.balance, currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Bookings:</Text>
            <Text style={styles.summaryValue}>{totalBookings}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Booking Amount:</Text>
            <Text style={styles.summaryValue}>{fCurrency(totalBookingAmount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Credits:</Text>
            <Text style={[styles.summaryValue, { color: '#008000' }]}>
              {fCurrency(totalCredits, currency)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Debits:</Text>
            <Text style={[styles.summaryValue, { color: '#FF0000' }]}>
              {fCurrency(totalDebits, currency)}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 10, paddingTop: 10, borderTop: '1 solid #000' }]}>
            <Text style={[styles.summaryLabel, { fontSize: 12 }]}>Current Balance:</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
              {fCurrency(currentBalance, currency)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated statement of account.</Text>
          <Text style={{ marginTop: 5 }}>
            For any queries, please contact our customer support.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
