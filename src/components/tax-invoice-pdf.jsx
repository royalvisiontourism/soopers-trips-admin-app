import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { ROYAL_VISION_VAT_TRN } from '@/lib/constants/company';

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
const fCurrency = (amount) => {
  const value = Number(amount || 0);
  return value.toFixed(2);
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
  companySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textDecoration: 'underline',
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  invoiceInfoLeft: {
    width: '50%',
  },
  invoiceInfoRight: {
    width: '50%',
    textAlign: 'right',
  },
  label: {
    fontSize: 9,
    marginBottom: 3,
    color: '#666',
  },
  value: {
    fontSize: 10,
    marginBottom: 5,
  },
  partySection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  partyTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  partyRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  partyLabel: {
    fontSize: 9,
    width: 100,
    fontWeight: 'bold',
  },
  partyValue: {
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
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ccc',
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'center',
  },
  col1: { width: '5%' },
  col2: { width: '35%' },
  col3: { width: '10%' },
  col4: { width: '10%' },
  col5: { width: '8%' },
  col6: { width: '7%' },
  col7: { width: '12%' },
  col8: { width: '13%' },
  totalRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderTop: '2 solid #000',
    borderBottom: '2 solid #000',
  },
  totalCell: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  amountWords: {
    marginTop: 15,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  amountWordsText: {
    fontSize: 9,
    marginBottom: 3,
  },
  vatTable: {
    marginTop: 15,
    marginBottom: 15,
  },
  vatTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderBottom: '1 solid #000',
  },
  vatTableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ccc',
  },
  vatCol1: { width: '20%' },
  vatCol2: { width: '40%' },
  vatCol3: { width: '40%' },
  remarks: {
    marginTop: 15,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  remarksTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 9,
  },
  bankDetails: {
    marginTop: 15,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  bankTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bankLabel: {
    fontSize: 9,
    width: 150,
    fontWeight: 'bold',
  },
  bankValue: {
    fontSize: 9,
    flex: 1,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #ccc',
  },
  declaration: {
    marginTop: 15,
    fontSize: 9,
    fontStyle: 'italic',
  },
  signature: {
    marginTop: 30,
    textAlign: 'right',
  },
  signatureText: {
    fontSize: 9,
    marginTop: 40,
  },
  computerGenerated: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  },
});

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
  }
  if (num < 100000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    return numberToWords(thousand) + ' Thousand' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
  }
  return num.toString();
};

const formatAmountInWords = (amount) => {
  const wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);
  const words = numberToWords(wholePart);
  const decimalWords = decimalPart > 0 ? numberToWords(decimalPart) : '';
  return `UAE Dirhams ${words}${decimalWords ? ' and ' + decimalWords : ''} Only (AED ${amount.toFixed(2)})`;
};

export const TaxInvoicePDF = ({ booking, logoUrl }) => {
  if (!booking) return null;

  // Calculate VAT (assuming 5% VAT rate)
  const vatRate = 0.05;
  const bookingTotalAmount = parseFloat(booking.totalAmount || 0);
  
  const calculatedVatAmount = booking.taxAmount 
    ? parseFloat(booking.taxAmount) 
    : bookingTotalAmount * vatRate / (1 + vatRate);
  
  const calculatedAssessableValue = bookingTotalAmount - calculatedVatAmount;

  // Get customer/party information
  const partyName = booking.guestInfo?.firstName 
    ? `${booking.guestInfo.firstName}${booking.guestInfo.lastName ? ' ' + booking.guestInfo.lastName : ''}`
    : booking.user?.name || 'N/A';
  const partyEmail = booking.guestInfo?.email || booking.user?.email || 'N/A';
  const partyPhone = booking.guestInfo?.phone || booking.user?.phone || 'N/A';
  const partyAddress = booking.guestInfo?.address || 'N/A';
  const partyCity = booking.guestInfo?.city || 'N/A';
  const partyEmirate = booking.guestInfo?.emirate || 'Dubai';
  const partyCountry = booking.guestInfo?.country || 'UAE';
  const partyTRN = booking.guestInfo?.trn || 'N/A';
  const placeOfSupply = partyEmirate || 'Dubai';

  // Generate invoice number
  const invoiceNo = booking.bookingId?.replace('BK-', '') || `INV-${Date.now()}`;
  const invoiceDate = fDate(booking.createdAt);

  // Prepare items for the table
  const items = [];
  
  if (booking.bookingType === 'PRODUCT' && booking.productItems) {
    booking.productItems.forEach((item, index) => {
      const productName = item.product?.title || item.product?.name || 'Product';
      const quantity = item.quantity || 1;
      const adults = item.adults || 0;
      const children = item.children || 0;
      const infants = item.infants || 0;
      const travelers = adults + children + infants || quantity;
      const rate = parseFloat(item.basePrice || 0) / quantity;
      const amount = parseFloat(item.basePrice || 0);
      
      items.push({
        sno: index + 1,
        description: `${productName} - ${travelers} PAX`,
        quantity: `${travelers} PAX`,
        rate: rate.toFixed(2),
        per: 'PAX',
        discount: '',
        amount: amount.toFixed(2),
        vat: '5%',
      });
    });
  } else if (booking.bookingType === 'PACKAGE' && booking.packageItem) {
    const packageName = booking.packageItem.package?.name || booking.packageItem.package?.title || 'Package';
    const persons = booking.packageItem.person || 1;
    const rate = parseFloat(booking.packageItem.basePrice || 0) / persons;
    const amount = parseFloat(booking.packageItem.basePrice || 0);
    
    items.push({
      sno: 1,
      description: `${packageName} - ${persons} PAX`,
      quantity: `${persons} PAX`,
      rate: rate.toFixed(2),
      per: 'PAX',
      discount: '',
      amount: amount.toFixed(2),
      vat: '5%',
    });
  } else if (booking.bookingType === 'TICKET' && booking.ticketItems) {
    booking.ticketItems.forEach((item, index) => {
      const ticketName = item.ticket?.title || item.ticket?.name || 'Ticket';
      const quantity = item.quantity || 1;
      const rate = parseFloat(item.basePrice || 0) / quantity;
      const amount = parseFloat(item.basePrice || 0);
      
      items.push({
        sno: index + 1,
        description: `${ticketName} - ${quantity} TICKET${quantity > 1 ? 'S' : ''}`,
        quantity: `${quantity}`,
        rate: rate.toFixed(2),
        per: 'TICKET',
        discount: '',
        amount: amount.toFixed(2),
        vat: '5%',
      });
    });
  }

  // Calculate totals from items
  const totalQuantity = items.reduce((sum, item) => {
    const qty = parseInt(item.quantity) || 0;
    return sum + qty;
  }, 0);
  const itemsTotalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  
  const finalSubtotal = bookingTotalAmount || itemsTotalAmount;
  const finalVatAmount = booking.taxAmount 
    ? parseFloat(booking.taxAmount) 
    : finalSubtotal * vatRate / (1 + vatRate);
  const finalAssessableValue = finalSubtotal - finalVatAmount;

  // Remarks
  const remarks = booking.guestInfo?.notes || booking.notes || '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo */}
          {logoUrl && (
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                src={logoUrl}
                cache={false}
              />
            </View>
          )}
          <Text style={styles.companyName}>THE ROYAL VISION TOURISM LLC</Text>
          <Text style={styles.companySubtitle}>ROYAL VISION TOURISM</Text>
          <Text style={styles.companySubtitle}>Company&apos;s VAT TRN: {ROYAL_VISION_VAT_TRN}</Text>
          <Text style={styles.invoiceTitle}>Tax Invoice</Text>
        </View>

        {/* Invoice Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceInfoLeft}>
            <Text style={styles.label}>Invoice No.</Text>
            <Text style={styles.value}>{invoiceNo}</Text>
            <Text style={styles.label}>Ref. No.</Text>
            <Text style={styles.value}>{booking.bookingId || 'N/A'}</Text>
          </View>
          <View style={styles.invoiceInfoRight}>
            <Text style={styles.label}>Dated</Text>
            <Text style={styles.value}>{invoiceDate}</Text>
          </View>
        </View>

        {/* Party Information */}
        <View style={styles.partySection}>
          <Text style={styles.partyTitle}>Party : {partyName}</Text>
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Address:</Text>
            <Text style={styles.partyValue}>{partyAddress}, {partyCity}, {partyEmirate}</Text>
          </View>
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Emirate:</Text>
            <Text style={styles.partyValue}>{partyEmirate}</Text>
          </View>
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Country:</Text>
            <Text style={styles.partyValue}>{partyCountry}</Text>
          </View>
          {partyTRN !== 'N/A' && (
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>TRN:</Text>
              <Text style={styles.partyValue}>{partyTRN}</Text>
            </View>
          )}
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Place of supply:</Text>
            <Text style={styles.partyValue}>UAE, {placeOfSupply}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>SI.No</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Description of Goods</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>per</Text>
            <Text style={[styles.tableHeaderCell, styles.col6]}>Disc. %</Text>
            <Text style={[styles.tableHeaderCell, styles.col7]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, styles.col8]}>VAT %</Text>
          </View>
          {items.map((item) => (
            <View key={item.sno} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{item.sno}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.col4]}>{item.rate}</Text>
              <Text style={[styles.tableCell, styles.col5]}>{item.per}</Text>
              <Text style={[styles.tableCell, styles.col6]}>{item.discount}</Text>
              <Text style={[styles.tableCell, styles.col7]}>{item.amount}</Text>
              <Text style={[styles.tableCell, styles.col8]}>{item.vat}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, styles.col1]}>Total</Text>
            <Text style={[styles.totalCell, styles.col2]}></Text>
            <Text style={[styles.totalCell, styles.col3]}>{totalQuantity} PAX</Text>
            <Text style={[styles.totalCell, styles.col4]}></Text>
            <Text style={[styles.totalCell, styles.col5]}></Text>
            <Text style={[styles.totalCell, styles.col6]}></Text>
            <Text style={[styles.totalCell, styles.col7]}>AED {finalAssessableValue.toFixed(2)}</Text>
            <Text style={[styles.totalCell, styles.col8]}>{finalVatAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountWords}>
          <Text style={styles.amountWordsText}>
            Amount Chargeable (in words)
          </Text>
          <Text style={styles.amountWordsText}>
            {formatAmountInWords(finalSubtotal)}
          </Text>
          <Text style={styles.amountWordsText}>
            VAT Amount (in words)
          </Text>
          <Text style={styles.amountWordsText}>
            UAE Dirhams {numberToWords(Math.round(finalVatAmount))} Only (AED {finalVatAmount.toFixed(2)})
          </Text>
        </View>

        {/* VAT Table */}
        <View style={styles.vatTable}>
          <View style={styles.vatTableHeader}>
            <Text style={[styles.tableHeaderCell, styles.vatCol1]}>VAT %</Text>
            <Text style={[styles.tableHeaderCell, styles.vatCol2]}>Assessable Value</Text>
            <Text style={[styles.tableHeaderCell, styles.vatCol3]}>Tax Amount</Text>
          </View>
          <View style={styles.vatTableRow}>
            <Text style={[styles.tableCell, styles.vatCol1]}>5 %</Text>
            <Text style={[styles.tableCell, styles.vatCol2]}>{finalAssessableValue.toFixed(2)}</Text>
            <Text style={[styles.tableCell, styles.vatCol3]}>{finalVatAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, styles.vatCol1]}>Total</Text>
            <Text style={[styles.totalCell, styles.vatCol2]}>{finalAssessableValue.toFixed(2)}</Text>
            <Text style={[styles.totalCell, styles.vatCol3]}>{finalVatAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Remarks */}
        {remarks && (
          <View style={styles.remarks}>
            <Text style={styles.remarksTitle}>Remarks:</Text>
            <Text style={styles.remarksText}>{remarks}</Text>
          </View>
        )}

        {/* Partner Details (when booking is from a partner) */}
        {booking.agent && typeof booking.agent === 'object' && (
          <View style={styles.bankDetails}>
            <Text style={styles.bankTitle}>Partner Details</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Company Name:</Text>
              <Text style={styles.bankValue}>{booking.agent.agentProfile?.companyName || booking.agent.name || 'N/A'}</Text>
            </View>
            {booking.agent.agentProfile?.officeAddress && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Address:</Text>
                <Text style={styles.bankValue}>{booking.agent.agentProfile.officeAddress}</Text>
              </View>
            )}
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>TRN:</Text>
              <Text style={styles.bankValue}>{booking.agent.agentProfile?.vatNumber || booking.agent.agentProfile?.tradeLicenseNumber || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Bank Details */}
        <View style={styles.bankDetails}>
          <Text style={styles.bankTitle}>Company's Bank Details</Text>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>A/c Holder's Name:</Text>
            <Text style={styles.bankValue}>THE ROYAL VISION TOURISM LLC</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Company's VAT TRN:</Text>
            <Text style={styles.bankValue}>{ROYAL_VISION_VAT_TRN}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Bank Name:</Text>
            <Text style={styles.bankValue}>RAK BANK</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>A/c No.:</Text>
            <Text style={styles.bankValue}>0551531921001</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>IBAN:</Text>
            <Text style={styles.bankValue}>AE880400000551531921001</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Branch & SWIFT Code:</Text>
            <Text style={styles.bankValue}>AL QUOZ- DUBAI & NRAKAEAK</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <Text style={styles.signatureText}>for THE ROYAL VISION TOURISM LLC</Text>
            <Text style={styles.signatureText}>Authorised Signatory</Text>
          </View>
          <View style={styles.declaration}>
            <Text>Declaration</Text>
            <Text>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text>
          </View>
          <Text style={styles.computerGenerated}>This is a Computer Generated Invoice</Text>
        </View>
      </Page>
    </Document>
  );
};
