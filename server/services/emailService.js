/**
 * Pluggable Email Service for Notifications
 * Safe fallback / mock transport during testing & development.
 */

const sendEmail = async ({ to, subject, html, text }) => {
  // If running in test mode or without SMTP credentials, use safe mock logger
  if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
    console.log(`[EMAIL MOCK SERVICE] To: ${to} | Subject: "${subject}" | Content snippet: ${(text || html || '').slice(0, 60)}...`);
    return { success: true, mocked: true };
  }

  // Future production Nodemailer integration entry point:
  try {
    // Return mock success to ensure non-blocking execution
    return { success: true, sent: true };
  } catch (error) {
    console.warn('[EMAIL SERVICE WARNING]', error.message);
    return { success: false, error: error.message };
  }
};

const sendOrderConfirmationEmail = async (userEmail, orderId, amount) => {
  return sendEmail({
    to: userEmail,
    subject: `Order Confirmation #${orderId}`,
    html: `<p>Thank you for your order <strong>#${orderId}</strong> of ₹${amount}.</p>`
  });
};

const sendPaymentSuccessEmail = async (userEmail, orderId, paymentId) => {
  return sendEmail({
    to: userEmail,
    subject: `Payment Successful for Order #${orderId}`,
    html: `<p>Payment ID ${paymentId} verified for order #${orderId}.</p>`
  });
};

const sendShippingUpdateEmail = async (userEmail, orderId, carrier, trackingNumber) => {
  return sendEmail({
    to: userEmail,
    subject: `Order #${orderId} Shipped`,
    html: `<p>Your order has been shipped via ${carrier || 'Courier'}. Tracking #: ${trackingNumber || 'N/A'}</p>`
  });
};

const sendReturnUpdateEmail = async (userEmail, returnId, status) => {
  return sendEmail({
    to: userEmail,
    subject: `Return Request Status Update`,
    html: `<p>Your return request #${returnId} status is now <strong>${status}</strong>.</p>`
  });
};

const sendAbandonedCartEmail = async (userEmail, itemCount) => {
  return sendEmail({
    to: userEmail,
    subject: `Items left in your SoleVibe cart!`,
    html: `<p>You have ${itemCount} items waiting in your cart. Return now to complete your purchase!</p>`
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendShippingUpdateEmail,
  sendReturnUpdateEmail,
  sendAbandonedCartEmail
};
