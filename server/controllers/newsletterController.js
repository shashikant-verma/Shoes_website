const Subscriber = require('../models/Subscriber');

// Email regex pattern for strict validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

// @desc    Subscribe an email address to the SoleVibe newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email, source = 'storefront' } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format (e.g. runner@example.com).'
      });
    }

    // Check if email already exists in subscribers
    const existing = await Subscriber.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(200).json({
          success: true,
          message: 'You are already on the SoleVibe athlete roster!',
          alreadySubscribed: true
        });
      } else {
        // Reactivate previously unsubscribed email
        existing.status = 'active';
        existing.source = source;
        existing.subscribedAt = new Date();
        await existing.save();

        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription to the SoleVibe athlete roster has been reactivated.',
          data: { email: existing.email, status: existing.status }
        });
      }
    }

    // Create new subscriber in MongoDB
    const newSubscriber = await Subscriber.create({
      email: normalizedEmail,
      source: ['homepage', 'footer', 'checkout', 'modal', 'storefront'].includes(source) ? source : 'storefront',
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Welcome to the SoleVibe athlete roster! Watch your inbox for drop updates.',
      data: {
        email: newSubscriber.email,
        status: newSubscriber.status,
        subscribedAt: newSubscriber.subscribedAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'You are already on the SoleVibe athlete roster!',
        alreadySubscribed: true
      });
    }
    next(error);
  }
};

module.exports = {
  subscribeNewsletter
};
