/**
 * Centralized Server-Side Shipping Rate & Delivery Calculation Engine
 */

const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD) || 15000;
const STANDARD_SHIPPING_FEE = Number(process.env.STANDARD_SHIPPING_FEE) || 150;
const EXPRESS_SHIPPING_FEE = Number(process.env.EXPRESS_SHIPPING_FEE) || 350;

const SHIPPING_METHODS = {
  standard: {
    code: 'standard',
    name: 'Standard Delivery',
    baseFee: STANDARD_SHIPPING_FEE,
    deliveryRange: '3-5 business days',
    businessDays: 4,
    active: true
  },
  express: {
    code: 'express',
    name: 'Express Courier',
    baseFee: EXPRESS_SHIPPING_FEE,
    deliveryRange: '1-2 business days',
    businessDays: 2,
    active: true
  },
  free: {
    code: 'free',
    name: 'Free Shipping',
    baseFee: 0,
    deliveryRange: '3-5 business days',
    businessDays: 4,
    active: true
  }
};

/**
 * Determine shipping zone from address
 */
const getShippingZone = (address = {}) => {
  const pincode = String(address.pincode || address.zipCode || address.zip || '').trim();
  const state = String(address.state || '').trim().toLowerCase();
  const country = String(address.country || 'India').trim().toLowerCase();

  // Destination restriction check
  if (pincode === '000000' || pincode === '000' || (country !== 'india' && country !== 'in')) {
    return { zone: 'RESTRICTED', valid: false, message: 'Delivery unavailable to specified destination address or pincode' };
  }

  if (pincode.startsWith('40') || pincode.startsWith('41') || state === 'maharashtra') {
    return { zone: 'LOCAL', valid: true };
  }

  if (['gujarat', 'goa', 'karnataka', 'madhya pradesh'].includes(state)) {
    return { zone: 'REGIONAL', valid: true };
  }

  return { zone: 'NATIONAL', valid: true };
};

/**
 * Add business days (skipping weekends) to a date
 */
const addBusinessDays = (startDate, days) => {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Saturday (6) and Sunday (0)
      added++;
    }
  }
  return date;
};

/**
 * Calculate shipping charges and estimated delivery
 */
const calculateShipping = ({
  subtotal = 0,
  method = 'standard',
  address = {},
  orderDate = new Date()
}) => {
  const parsedSubtotal = Math.max(0, Number(subtotal) || 0);

  // 1. Zone Validation
  const zoneInfo = getShippingZone(address);
  if (!zoneInfo.valid) {
    return {
      valid: false,
      message: zoneInfo.message,
      zone: zoneInfo.zone,
      charge: 0
    };
  }

  // 2. Validate Method
  const methodKey = String(method || 'standard').toLowerCase();
  const methodConfig = SHIPPING_METHODS[methodKey] || SHIPPING_METHODS.standard;

  // 3. Calculate Fee
  let charge = methodConfig.baseFee;
  let finalMethod = methodConfig.code;
  let finalMethodName = methodConfig.name;

  if (parsedSubtotal >= FREE_SHIPPING_THRESHOLD) {
    if (methodKey !== 'express') {
      charge = 0;
      finalMethod = 'free';
      finalMethodName = 'Free Shipping';
    }
  } else if (methodKey === 'free') {
    // If subtotal is under threshold but 'free' was requested, fallback to standard
    charge = methodConfig.baseFee > 0 ? methodConfig.baseFee : STANDARD_SHIPPING_FEE;
    finalMethod = 'standard';
    finalMethodName = 'Standard Delivery';
  }

  // 4. Calculate Delivery Estimate Date
  const estimatedDate = addBusinessDays(orderDate, methodConfig.businessDays);

  return {
    valid: true,
    method: finalMethod,
    methodName: finalMethodName,
    charge,
    freeThreshold: FREE_SHIPPING_THRESHOLD,
    isFreeEligible: parsedSubtotal >= FREE_SHIPPING_THRESHOLD,
    zone: zoneInfo.zone,
    deliveryRange: methodConfig.deliveryRange,
    estimatedDeliveryDate: estimatedDate
  };
};

/**
 * Available shipping options list for checkout UI
 */
const getAvailableShippingMethods = (subtotal = 0, address = {}) => {
  const zoneInfo = getShippingZone(address);
  if (!zoneInfo.valid) {
    return { valid: false, message: zoneInfo.message, options: [] };
  }

  const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;

  const options = [
    {
      code: 'standard',
      name: 'Standard Delivery',
      charge: isFree ? 0 : STANDARD_SHIPPING_FEE,
      deliveryRange: SHIPPING_METHODS.standard.deliveryRange,
      estimatedDeliveryDate: addBusinessDays(new Date(), SHIPPING_METHODS.standard.businessDays)
    },
    {
      code: 'express',
      name: 'Express Courier',
      charge: EXPRESS_SHIPPING_FEE,
      deliveryRange: SHIPPING_METHODS.express.deliveryRange,
      estimatedDeliveryDate: addBusinessDays(new Date(), SHIPPING_METHODS.express.businessDays)
    }
  ];

  return {
    valid: true,
    zone: zoneInfo.zone,
    subtotal,
    freeThreshold: FREE_SHIPPING_THRESHOLD,
    isFreeEligible: isFree,
    options
  };
};

module.exports = {
  calculateShipping,
  getAvailableShippingMethods,
  getShippingZone,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_METHODS
};
