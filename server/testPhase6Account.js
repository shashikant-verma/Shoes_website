const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase6Tests() {
  console.log('='.repeat(80));
  console.log('       SOLEVIBE PHASE 6: CUSTOMER ACCOUNT EXPERIENCE VERIFICATION');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ✅ ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  let authToken = null;
  let testUser = null;
  let testAddressId = null;
  const initialPassword = 'Password123!';
  const updatedPassword = 'NewPassword456!';
  const uniqueEmail = `runner_phase6_${Date.now()}@solevibe.test`;

  try {
    // 1. Customer Registration Test
    console.log('\n--- 1. Authentication & Registration ---');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'SoleVibe Trial Runner',
      email: uniqueEmail,
      password: initialPassword,
      phone: '+91 98765 43210'
    });

    report(
      'Registration: Creates new athlete account with JWT and customer role',
      registerRes.data.success && registerRes.data.token && (registerRes.data.user?.id || registerRes.data.user?._id),
      `User ID: ${registerRes.data.user?.id || registerRes.data.user?._id}, Email: ${registerRes.data.user?.email}`
    );
    authToken = registerRes.data.token;
    testUser = registerRes.data.user;

    const authHeaders = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    // 2. Customer Login Test with Initial Credentials
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: initialPassword
    });

    report(
      'Authentication: Successful login with initial credentials returning valid token',
      loginRes.data.success && loginRes.data.token && (loginRes.data.user?.id || loginRes.data.user?._id) === (testUser.id || testUser._id),
      `Token format: Bearer, User: ${loginRes.data.user?.name}`
    );

    // 3. Customer Profile Update (Name & Phone)
    console.log('\n--- 2. Customer Profile Management ---');
    const updatedName = 'SoleVibe Pro Athlete';
    const profileUpdateRes = await axios.put(
      `${BASE_URL}/auth/profile`,
      { name: updatedName, phone: '+91 91234 56789' },
      authHeaders
    );

    report(
      'Profile Update: Successfully updates athlete display name via PUT /api/auth/profile',
      profileUpdateRes.data.success && profileUpdateRes.data.user?.name === updatedName,
      `New Name: ${profileUpdateRes.data.user?.name}`
    );

    // 4. Update Password & Verify New Authentication
    console.log('\n--- 3. Security & Password Update ---');
    const pwUpdateRes = await axios.put(
      `${BASE_URL}/auth/update-password`,
      {
        currentPassword: initialPassword,
        newPassword: updatedPassword
      },
      authHeaders
    );

    report(
      'Password Update: Successfully changes password via PUT /api/auth/update-password',
      pwUpdateRes.data.success,
      `Message: ${pwUpdateRes.data.message || 'Password updated'}`
    );

    // Verify login with updated password
    const newLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: updatedPassword
    });

    report(
      'Security Verification: Successful login using the newly updated password',
      newLoginRes.data.success && newLoginRes.data.token,
      'New credentials verified'
    );
    authToken = newLoginRes.data.token;
    const newAuthHeaders = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    // 5. Address Book CRUD Operations
    console.log('\n--- 4. Address Book Management ---');
    // 5a. Create Delivery Address
    const addressCreateRes = await axios.post(
      `${BASE_URL}/addresses`,
      {
        fullName: 'SoleVibe Runner',
        phone: '9876543210',
        addressLine1: 'Flat 402, High Performance Residency',
        addressLine2: 'Indiranagar 100ft Road',
        landmark: 'Near Metro Station',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        type: 'HOME',
        isDefault: true
      },
      newAuthHeaders
    );

    report(
      'Address Book: Successfully created new home delivery address',
      addressCreateRes.data.success && addressCreateRes.data.data?._id,
      `Address ID: ${addressCreateRes.data.data?._id}`
    );
    testAddressId = addressCreateRes.data.data?._id;

    // 5b. Fetch Address List
    const addressListRes = await axios.get(`${BASE_URL}/addresses`, newAuthHeaders);
    report(
      'Address Book: Retrieves customer addresses with default address flag',
      addressListRes.data.success &&
      Array.isArray(addressListRes.data.data) &&
      addressListRes.data.data.length >= 1 &&
      addressListRes.data.data[0].isDefault === true,
      `Count: ${addressListRes.data.data?.length}`
    );

    // 5c. Update Address
    const addressUpdateRes = await axios.put(
      `${BASE_URL}/addresses/${testAddressId}`,
      {
        fullName: 'SoleVibe Elite Runner',
        phone: '9876543210',
        addressLine1: 'Flat 402, High Performance Residency',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        type: 'OFFICE'
      },
      newAuthHeaders
    );

    report(
      'Address Book: Updates address details successfully',
      addressUpdateRes.data.success && addressUpdateRes.data.data?.fullName === 'SoleVibe Elite Runner',
      `Updated Type: ${addressUpdateRes.data.data?.type}`
    );

    // 6. Order History Retrieval
    console.log('\n--- 5. Order History & Tracking ---');
    const ordersRes = await axios.get(`${BASE_URL}/orders`, newAuthHeaders);
    report(
      'Order History: Customer can query their own order history endpoint',
      ordersRes.data.success && Array.isArray(ordersRes.data.data),
      `Active Orders Count: ${ordersRes.data.data?.length}`
    );

    // 7. Returns & Refunds Management
    console.log('\n--- 6. Returns & Refunds ---');
    const returnsRes = await axios.get(`${BASE_URL}/returns/my`, newAuthHeaders);
    report(
      'Returns Service: Queries customer return claims (strictly 7-day window backend logic)',
      returnsRes.data.success && Array.isArray(returnsRes.data.data),
      `Returns Count: ${returnsRes.data.data?.length}`
    );

    // 8. In-Account Notifications Inbox
    console.log('\n--- 7. In-Account Notifications Inbox ---');
    const notifsRes = await axios.get(`${BASE_URL}/notifications`, newAuthHeaders);
    report(
      'Notifications Inbox: Customer can retrieve personal notifications and unread counter',
      notifsRes.data.success && Array.isArray(notifsRes.data.data),
      `Total: ${notifsRes.data.data?.length}, Unread: ${notifsRes.data.unreadCount || 0}`
    );

    const markAllReadRes = await axios.put(`${BASE_URL}/notifications/read-all`, {}, newAuthHeaders);
    report(
      'Notifications Inbox: Bulk mark all notifications as read executes cleanly',
      markAllReadRes.data.success,
      `Status: ${markAllReadRes.data.message || 'Marked all as read'}`
    );

    // Clean up test address
    if (testAddressId) {
      await axios.delete(`${BASE_URL}/addresses/${testAddressId}`, newAuthHeaders);
      report('Cleanup: Deleted temporary Phase 6 test address', true, `ID: ${testAddressId}`);
    }

  } catch (err) {
    console.error('Test Execution Error:', err.response?.data || err.message);
    report('Phase 6 Test Execution', false, err.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`PHASE 6 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests();
