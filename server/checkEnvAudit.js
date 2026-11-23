const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  console.log('--- .env Configuration Audit ---');
  for (const [key, val] of Object.entries(envConfig)) {
    const isSet = Boolean(val && val.trim());
    const isDevPlaceholder = /placeholder|your_|example|your-email|test_placeholder/i.test(val);
    const mode = isDevPlaceholder ? 'DEVELOPMENT_PLACEHOLDER' : (isSet ? 'CONFIGURED_CUSTOM' : 'EMPTY');
    console.log(`${key}: status=${mode}, length=${val.length}`);
  }
} else {
  console.log('.env file not found');
}
