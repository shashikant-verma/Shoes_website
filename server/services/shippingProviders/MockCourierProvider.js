const BaseCourierProvider = require('./BaseCourierProvider');

class MockCourierProvider extends BaseCourierProvider {
  constructor() {
    super('BlueDart');
  }

  async createShipment(order) {
    const timestamp = Date.now().toString().slice(-6);
    const trackingNumber = `BD-TRK-${timestamp}`;
    
    return {
      success: true,
      provider: this.name,
      trackingNumber,
      carrier: this.name,
      labelUrl: `https://example.com/labels/${trackingNumber}.pdf`,
      estimatedDeliveryDate: order.estimatedDeliveryDate || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    };
  }

  async fetchTracking(trackingNumber) {
    return {
      success: true,
      provider: this.name,
      trackingNumber,
      status: 'shipped',
      location: 'Hub - In Transit',
      updates: [
        { status: 'shipped', location: 'Dispatch Center', timestamp: new Date() }
      ]
    };
  }

  async cancelShipment(trackingNumber) {
    return {
      success: true,
      trackingNumber,
      message: 'Shipment cancelled with courier provider'
    };
  }
}

module.exports = MockCourierProvider;
