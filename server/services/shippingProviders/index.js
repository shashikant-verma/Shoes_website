const MockCourierProvider = require('./MockCourierProvider');

const providers = {
  bluedart: new MockCourierProvider(),
  mock: new MockCourierProvider()
};

const getCourierProvider = (providerName = 'bluedart') => {
  const key = String(providerName).toLowerCase();
  return providers[key] || providers.bluedart;
};

module.exports = {
  getCourierProvider,
  MockCourierProvider
};
