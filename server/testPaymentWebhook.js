const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5001/api';

async function testPaymentAndWebhook() {
  console.log('Testing Razorpay Webhook & Payment Audit Integration...');

  // 1. Login user
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'john@example.com',
    password: 'password123'
  });
  const token = loginRes.data.token;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Fetch a product to purchase
  const prodRes = await axios.get(`${BASE_URL}/products?limit=1`);
  const product = prodRes.data.data[0];
  console.log(`Using product: ${product.name} (₹${product.price})`);

  // 3. Create Payment Order with real item & shipping address
  const createOrderRes = await axios.post(`${BASE_URL}/payment/create-order`, {
    items: [
      {
        product: product._id,
        quantity: 1,
        size: '9'
      }
    ],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '9876543210',
      street: 'Flat 101, Palm Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      type: 'HOME'
    }
  }, authHeaders);

  console.log('Payment Order Created Successfully:', createOrderRes.data);
  const razorpayOrderId = createOrderRes.data.razorpayOrderId;
  if (!createOrderRes.data.success || !razorpayOrderId) {
    throw new Error('Create payment order failed');
  }

  // 4. Test Webhook with HMAC-SHA256 signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'solevibe_webhook_secret_dev_key';
  const webhookPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_${Date.now()}`,
          order_id: razorpayOrderId,
          amount: Math.round(product.price * 100),
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        }
      }
    }
  };

  const bodyStr = JSON.stringify(webhookPayload);
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyStr)
    .digest('hex');

  const webhookRes = await axios.post(`${BASE_URL}/payment/webhook`, webhookPayload, {
    headers: {
      'x-razorpay-signature': signature,
      'x-razorpay-event-id': `evt_${Date.now()}`
    }
  });

  console.log('Webhook Processed Successfully:', webhookRes.data);
  if (webhookRes.data.status !== 'ok') {
    throw new Error('Webhook processing failed');
  }

  console.log('✅ Payment Order Creation & Webhook Audit Logging Succeeded!');
}

testPaymentAndWebhook().catch(err => {
  console.error('❌ Error testing payment/webhook:', err.response?.data || err.message);
  process.exit(1);
});
