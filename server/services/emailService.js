/**
 * SoleVibe Enterprise Transactional Email Service
 * Powered by Nodemailer with safe development mock fallback.
 */

const nodemailer = require('nodemailer');

let transporter = null;

// Initialize transporter safely based on environment variables
const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
      console.log(`📧 SMTP Transporter configured for host: ${host}:${port}`);
    } catch (err) {
      console.warn('⚠️ SMTP Transporter creation failed, falling back to mock mode:', err.message);
      transporter = null;
    }
  }

  return transporter;
};

// Base HTML layout wrapper for SoleVibe branding
const getHtmlLayout = (title, bodyContent) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e5e7eb; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #16181f; border: 1px solid #272a38; border-radius: 12px; overflow: hidden; }
      .header { background: #000000; padding: 24px; text-align: center; border-bottom: 2px solid #ff4d2e; }
      .brand { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #ffffff; }
      .brand span { color: #ff4d2e; }
      .content { padding: 32px 24px; line-height: 1.6; color: #d1d5db; }
      .btn { display: inline-block; background: #ff4d2e; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; border-radius: 6px; margin-top: 16px; }
      .footer { background: #0e1017; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2330; }
      .data-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      .data-table th, .data-table td { padding: 10px; border-bottom: 1px solid #2a2e40; text-align: left; }
      .highlight { color: #ff4d2e; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">⚡ SOLE<span>VIBE</span></div>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} SoleVibe Footwear Inc. All rights reserved.<br>
        Bandra Kurla Complex, Mumbai, Maharashtra 400051<br>
        Questions? Contact support@solevibe.com
      </div>
    </div>
  </body>
  </html>
  `;
};

// Core sending engine
const sendEmail = async ({ to, subject, html, text }) => {
  const mailTransporter = getTransporter();
  const from = process.env.SMTP_FROM || '"SoleVibe Footwear" <orders@solevibe.com>';

  // If running in development without SMTP credentials, use safe mock
  if (!mailTransporter) {
    console.log(`[EMAIL DISPATCH - MOCK MODE] To: ${to} | Subject: "${subject}"`);
    return { success: true, mocked: true, recipient: to, subject };
  }

  try {
    const info = await mailTransporter.sendMail({
      from,
      to,
      subject,
      text: text || 'Please open this email in an HTML compatible mail client.',
      html
    });

    console.log(`✅ [EMAIL SENT] MessageId: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId, sent: true };
  } catch (error) {
    console.warn(`⚠️ [EMAIL SERVICE ERROR] Failed to send to ${to}: ${error.message}`);
    // Non-blocking: Do not fail calling processes
    return { success: false, error: error.message };
  }
};

// 1. Welcome / Registration
const sendWelcomeEmail = async (userEmail, userName) => {
  const body = `
    <h2>Welcome to the Vibe, ${userName || 'Athlete'}! ⚡</h2>
    <p>Thank you for joining SoleVibe. You now have privileged access to elite biomechanically engineered footwear, fast checkout, exclusive drops, and personal order tracking.</p>
    <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Explore The Collection</a></p>
  `;
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to SoleVibe Footwear',
    html: getHtmlLayout('Welcome to SoleVibe', body)
  });
};

// 2. Order Confirmation
const sendOrderConfirmationEmail = async (userEmail, orderId, amount, items = []) => {
  const itemsHtml = items.length > 0 ? `
    <table class="data-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Size</th><th>Price</th></tr></thead>
      <tbody>
        ${items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.size || 'Standard'}</td><td>₹${i.price}</td></tr>`).join('')}
      </tbody>
    </table>
  ` : '';

  const body = `
    <h2>Order Confirmed! 📦</h2>
    <p>Your order <strong class="highlight">#${orderId}</strong> has been received and is being prepared by our warehouse team.</p>
    <p><strong>Order Total:</strong> ₹${amount}</p>
    ${itemsHtml}
    <p>We will notify you the moment your footwear is dispatched with courier tracking details.</p>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Order Confirmed #${orderId} - SoleVibe`,
    html: getHtmlLayout(`Order #${orderId} Confirmed`, body)
  });
};

// 3. Payment Success
const sendPaymentSuccessEmail = async (userEmail, orderId, paymentId, amount) => {
  const body = `
    <h2>Payment Verified Successfully ✅</h2>
    <p>Your payment of <strong>₹${amount}</strong> for Order <strong class="highlight">#${orderId}</strong> has been securely authorized and verified.</p>
    <p><strong>Transaction / Payment ID:</strong> <code>${paymentId}</code></p>
    <p>Your order is now moving into immediate fulfillment.</p>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Payment Successful for Order #${orderId}`,
    html: getHtmlLayout('Payment Verified', body)
  });
};

// 4. Payment Failed
const sendPaymentFailedEmail = async (userEmail, orderId, failureReason) => {
  const body = `
    <h2 style="color: #ef4444;">Payment Transaction Failed ❌</h2>
    <p>We were unable to process your payment for Order #${orderId}.</p>
    <p><strong>Reason:</strong> ${failureReason || 'Transaction declined by payment provider'}</p>
    <p>No funds were debited. You may retry your payment securely using another card, UPI, or NetBanking.</p>
    <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/cart" class="btn">Retry Payment</a></p>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Payment Failed for Order #${orderId}`,
    html: getHtmlLayout('Payment Failed', body)
  });
};

// 5. Order Shipped
const sendShippingUpdateEmail = async (userEmail, orderId, carrier, trackingNumber, estimatedDeliveryDate) => {
  const body = `
    <h2>Your SoleVibe Order is On The Move! 🚚</h2>
    <p>Order <strong class="highlight">#${orderId}</strong> has been handed over to our shipping partner.</p>
    <div style="background: #1f2330; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Courier Carrier:</strong> ${carrier || 'Express Courier'}</p>
      <p style="margin: 4px 0;"><strong>Tracking Number:</strong> <code class="highlight">${trackingNumber || 'Available shortly'}</code></p>
      ${estimatedDeliveryDate ? `<p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> ${new Date(estimatedDeliveryDate).toLocaleDateString('en-IN')}</p>` : ''}
    </div>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Order #${orderId} Dispatched & Shipped`,
    html: getHtmlLayout('Order Shipped', body)
  });
};

// 6. Order Delivered
const sendOrderDeliveredEmail = async (userEmail, orderId) => {
  const body = `
    <h2>Order Delivered! 🎉👟</h2>
    <p>Your SoleVibe package for Order <strong class="highlight">#${orderId}</strong> was delivered to your address.</p>
    <p>We hope your new pair powers your best performance. Please take a moment to leave a review!</p>
    <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Rate & Review Products</a></p>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Order #${orderId} Delivered - SoleVibe`,
    html: getHtmlLayout('Order Delivered', body)
  });
};

// 7. Order Cancellation
const sendOrderCancelledEmail = async (userEmail, orderId, reason) => {
  const body = `
    <h2>Order Cancellation Notice</h2>
    <p>Order #${orderId} has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason || 'Cancelled upon customer request'}</p>
    <p>If payment was completed, your refund is being initiated to the source payment method.</p>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Order #${orderId} Cancelled`,
    html: getHtmlLayout('Order Cancelled', body)
  });
};

// 8. Return Update
const sendReturnUpdateEmail = async (userEmail, returnId, status, refundAmount) => {
  const body = `
    <h2>Return Request Update</h2>
    <p>Your return request <strong class="highlight">#${returnId}</strong> status is now: <strong>${status}</strong>.</p>
    ${refundAmount ? `<p><strong>Refund Amount:</strong> ₹${refundAmount}</p>` : ''}
    <p>Our support team will coordinate doorstep pickup or refund processing accordingly.</p>
  `;
  return sendEmail({
    to: userEmail,
    subject: `Return Request #${returnId} Update: ${status}`,
    html: getHtmlLayout('Return Status Update', body)
  });
};

// 9. Password Reset
const sendPasswordResetEmail = async (userEmail, resetTokenOrUrl) => {
  const body = `
    <h2>Password Reset Request 🔐</h2>
    <p>We received a request to reset your SoleVibe account password. Click below to choose a new password:</p>
    <p><a href="${resetTokenOrUrl}" class="btn">Reset Password</a></p>
    <p>If you did not request this, please ignore this email or secure your account.</p>
  `;
  return sendEmail({
    to: userEmail,
    subject: 'SoleVibe Password Reset Request',
    html: getHtmlLayout('Password Reset', body)
  });
};

// 10. Admin Notification
const sendAdminOrderNotificationEmail = async (adminEmail, orderId, customerName, totalAmount) => {
  const body = `
    <h2>New Customer Order Alert 🚨</h2>
    <p>Order <strong class="highlight">#${orderId}</strong> was just placed on SoleVibe.</p>
    <p><strong>Customer:</strong> ${customerName}</p>
    <p><strong>Total Value:</strong> ₹${totalAmount}</p>
    <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin" class="btn">View in Admin Panel</a></p>
  `;
  return sendEmail({
    to: adminEmail,
    subject: `[ADMIN ALERT] New Order #${orderId} (₹${totalAmount})`,
    html: getHtmlLayout('Admin Order Alert', body)
  });
};

// 11. Abandoned Cart
const sendAbandonedCartEmail = async (userEmail, itemCount) => {
  const body = `
    <h2>Did you leave something behind? 🛒</h2>
    <p>You have <strong>${itemCount}</strong> items waiting in your SoleVibe shopping bag.</p>
    <p>Your selected sizes are reserved for a limited time. Return now to complete your order!</p>
    <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/cart" class="btn">Return to Cart</a></p>
  `;
  return sendEmail({
    to: userEmail,
    subject: 'Items waiting in your SoleVibe cart!',
    html: getHtmlLayout('Complete Your Purchase', body)
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendShippingUpdateEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendReturnUpdateEmail,
  sendPasswordResetEmail,
  sendAdminOrderNotificationEmail,
  sendAbandonedCartEmail
};
