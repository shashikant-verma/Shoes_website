const MockCourierProvider = require('./MockCourierProvider');
const ShiprocketProvider = require('./ShiprocketProvider');
const DelhiveryProvider = require('./DelhiveryProvider');

const providers = {
  bluedart: new MockCourierProvider(),
  mock: new MockCourierProvider(),
  shiprocket: new ShiprocketProvider(),
  delhivery: new DelhiveryProvider()
};

const getCourierProvider = (providerName) => {
  const selected = providerName || process.env.SHIPPING_PROVIDER || 'mock';
  const key = String(selected).toLowerCase();
  return providers[key] || providers.mock;
};

module.exports = {
  getCourierProvider,
  MockCourierProvider,
  ShiprocketProvider,
  DelhiveryProvider
};
