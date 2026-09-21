/**
 * Abstract Base Courier Provider Interface
 */
class BaseCourierProvider {
  constructor(name = 'BaseCourier') {
    this.name = name;
  }

  async createShipment(orderData) {
    throw new Error('createShipment method must be implemented by courier provider');
  }

  async fetchTracking(trackingNumber) {
    throw new Error('fetchTracking method must be implemented by courier provider');
  }

  async cancelShipment(trackingNumber) {
    throw new Error('cancelShipment method must be implemented by courier provider');
  }
}

module.exports = BaseCourierProvider;
