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
    padding: 8,
    borderBottom: '1 solid #ccc',
  },
  tableCell: {
    fontSize: 9,
  },
  col1: { width: '8%' },
  col2: { width: '50%' },
  col3: { width: '20%' },
  col4: { width: '22%' },
  itemDetails: {
    marginTop: 5,
    paddingLeft: 5,
    fontSize: 8,
    color: '#555',
  },
  addonRow: {
    flexDirection: 'row',
    marginTop: 3,
    paddingLeft: 10,
    fontSize: 8,
    color: '#666',
  },
  addonLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1 solid #ccc',
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export const CustomerVoucherPDF = ({ booking, logoUrl }) => {
  if (!booking) return null;

  // Generate voucher number
  const voucherNo = booking.bookingId || `VCH-${Date.now()}`;
  const voucherDate = fDate(booking.createdAt);

  // Get customer name (only use agent-provided customerName, no fallback to agent info)
  const customerName = booking.guestInfo?.customerName || 'N/A';

  // Get customer phone (only use agent-provided customerPhone, no fallback to agent info)
  const customerPhone = booking.guestInfo?.customerPhone || 'N/A';

  // Get booking type
  const bookingType = booking.bookingType || 'N/A';

  // Get status
  const status = booking.status || 'N/A';

  // Collect all items with full details (without prices)
  const items = [];

  // Product items
  if (booking.productItems && booking.productItems.length > 0) {
    booking.productItems.forEach((item, idx) => {
      const product = item.product || {};
      const itemName = product.title || product.name || `Product ${idx + 1}`;
      const itemDescription = product.shortDescription || product.description || '';
      const quantity = item.quantity || 1;
      const adults = item.adults || 0;
      const children = item.children || 0;
      const infants = item.infants || 0;
      
      // Build travelers info
      const travelers = [];
      if (adults > 0) travelers.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
      if (children > 0) travelers.push(`${children} Child${children > 1 ? 'ren' : ''}`);
      if (infants > 0) travelers.push(`${infants} Infant${infants > 1 ? 's' : ''}`);
      const travelersText = travelers.length > 0 ? travelers.join(', ') : `${quantity} PAX`;

      // Collect addon details (without prices)
      const addons = [];
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach((addon) => {
          const addonName = addon.addon?.name || addon.name || 'Addon';
          const addonQty = addon.quantity || 1;
          addons.push({
            name: addonName,
            quantity: addonQty,
          });
        });
      }

      items.push({
        sr: items.length + 1,
        name: itemName,
        description: itemDescription,
        date: item.selectedDate ? fDate(item.selectedDate) : '-',
        quantity: quantity,
        travelers: travelersText,
        addons: addons,
        type: 'PRODUCT',
      });
    });
  }

  // Package item
  if (booking.packageItem) {
    const packageItem = booking.packageItem;
    const packageData = packageItem.package || {};
    const itemName = packageData.title || packageData.name || 'Package';
    const itemDescription = packageData.shortDescription || packageData.description || '';
    const quantity = packageItem.person || 1;

    // Collect addon details (without prices)
    const addons = [];
    if (packageItem.addons && packageItem.addons.length > 0) {
      packageItem.addons.forEach((addon) => {
        const addonName = addon.addon?.name || addon.name || 'Addon';
        const addonQty = addon.quantity || 1;
        addons.push({
          name: addonName,
          quantity: addonQty,
        });
      });
    }

    // Transportation details
    let transportationInfo = '';
    if (packageItem.transportation?.pickupAddress) {
      transportationInfo = `Pickup: ${packageItem.transportation.pickupAddress}`;
      if (packageItem.transportation.pickupTime) {
        transportationInfo += ` at ${fDateTime(packageItem.transportation.pickupTime)}`;
      }
    }

    items.push({
      sr: items.length + 1,
      name: itemName,
      description: itemDescription,
      date: packageItem.startDate
        ? `${fDate(packageItem.startDate)} to ${fDate(packageItem.endDate)}`
        : '-',
      quantity: quantity,
      travelers: `${quantity} Person${quantity > 1 ? 's' : ''}`,
      addons: addons,
      transportation: transportationInfo,
      type: 'PACKAGE',
    });
  }

  // Ticket items
  if (booking.ticketItems && booking.ticketItems.length > 0) {
    booking.ticketItems.forEach((item, idx) => {
      const ticket = item.ticket || {};
      const itemName = ticket.title || ticket.name || `Ticket ${idx + 1}`;
      const itemDescription = ticket.shortDescription || ticket.description || '';
      const quantity = item.quantity || 1;

      // Collect addon details (without prices)
      const addons = [];
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach((addon) => {
          const addonName = addon.addon?.name || addon.name || 'Addon';
          const addonQty = addon.quantity || 1;
          addons.push({
            name: addonName,
            quantity: addonQty,
          });
        });
      }

      // Ticket types details
      let ticketTypesInfo = '';
      if (item.ticketTypes && item.ticketTypes.length > 0) {
        const types = item.ticketTypes.map((tt) => {
          return `${tt.name || 'Type'} × ${tt.quantity || 1}`;
        });
        ticketTypesInfo = types.join(', ');
      }

      items.push({
        sr: items.length + 1,
        name: itemName,
        description: itemDescription,
        date: item.selectedDate ? fDate(item.selectedDate) : '-',
        quantity: quantity,
        travelers: ticketTypesInfo || `${quantity} Ticket${quantity > 1 ? 's' : ''}`,
        addons: addons,
        type: 'TICKET',
      });
    });
  }

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
          <Text style={styles.companyName}>Customer Voucher</Text>
          <Text style={styles.companySubtitle}>Booking Confirmation Voucher</Text>
        </View>

        {/* Voucher Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceInfoLeft}>
            <Text style={styles.label}>Voucher No.</Text>
            <Text style={styles.value}>{voucherNo}</Text>
            <Text style={styles.label}>Booking Date</Text>
            <Text style={styles.value}>{voucherDate}</Text>
          </View>
          <View style={styles.invoiceInfoRight}>
            <Text style={styles.label}>Booking Type</Text>
            <Text style={styles.value}>{bookingType}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{status}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name:</Text>
            <Text style={styles.rowValue}>{customerName}</Text>
          </View>
          {customerPhone !== 'N/A' && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Phone:</Text>
              <Text style={styles.rowValue}>{customerPhone}</Text>
            </View>
          )}
        </View>

        {/* Items Table (without price columns) */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Items & Details</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>Sr.</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Item Details</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>Date</Text>
                <Text style={[styles.tableHeaderCell, styles.col4]}>Quantity</Text>
              </View>
              {/* Table Rows */}
              {items.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.col1]}>{item.sr}</Text>
                  <View style={styles.col2}>
                    <Text style={styles.tableCell}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.itemDetails}>{item.description}</Text>
                    )}
                    {item.travelers && (
                      <Text style={styles.itemDetails}>Travelers: {item.travelers}</Text>
                    )}
                    {item.transportation && (
                      <Text style={styles.itemDetails}>{item.transportation}</Text>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <View style={{ marginTop: 3 }}>
                        <Text style={[styles.itemDetails, { fontWeight: 'bold' }]}>Addons:</Text>
                        {item.addons.map((addon, addonIdx) => (
                          <View key={addonIdx} style={styles.addonRow}>
                            <Text style={styles.addonLabel}>•</Text>
                            <Text>
                              {addon.name} × {addon.quantity}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tableCell, styles.col3]}>{item.date}</Text>
                  <Text style={[styles.tableCell, styles.col4]}>{item.quantity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated customer voucher.</Text>
          <Text style={{ marginTop: 5 }}>
            For any queries, please contact our customer support.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
