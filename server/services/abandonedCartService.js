const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { createCustomerNotification } = require('./notificationService');

const ABANDONED_CART_HOURS = Number(process.env.ABANDONED_CART_HOURS) || 24;

/**
 * Scan MongoDB for eligible abandoned carts and create notifications.
 */
const checkAbandonedCarts = async () => {
  try {
    const thresholdDate = new Date(Date.now() - ABANDONED_CART_HOURS * 60 * 60 * 1000);

    // 1. Find non-empty carts updated before the threshold
    const eligibleCarts = await Cart.find({
      items: { $exists: true, $not: { $size: 0 } },
      updatedAt: { $lte: thresholdDate }
    }).populate('user', 'name email role');

    let notificationsCreated = 0;

    for (const cart of eligibleCarts) {
      if (!cart.user || cart.user.role === 'ADMIN') continue;

      const userId = cart.user._id || cart.user;
      const cartUpdatedAt = new Date(cart.updatedAt).getTime();

      // 2. Check if user already placed an order AFTER or equal to cart's updatedAt timestamp
      const recentOrder = await Order.findOne({
        user: userId,
        createdAt: { $gte: cart.updatedAt }
      });

      if (recentOrder) {
        // User already checked out or created order for this cart state
        continue;
      }

      // 3. Check for existing ABANDONED_CART notification for this cart's updated state
      const referenceId = `ABANDONED_CART_${cart._id}_${cartUpdatedAt}`;
      const existingNotif = await Notification.findOne({ referenceId });

      if (existingNotif) {
        // Already notified for this exact cart state
        continue;
      }

      // 4. Create single abandoned cart notification
      const itemCount = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const title = 'You left items in your cart!';
      const message = `You have ${itemCount} item(s) waiting in your cart. Complete your purchase before stock runs out.`;

      await createCustomerNotification({
        recipient: userId,
        type: 'ABANDONED_CART',
        title,
        message,
        relatedResourceType: 'CART',
        relatedResourceId: String(cart._id),
        metadata: {
          itemCount,
          cartUpdatedAt
        },
        referenceId
      });

      notificationsCreated++;
    }

    return {
      success: true,
      eligibleCount: eligibleCarts.length,
      notificationsCreated
    };
  } catch (error) {
    console.error('Error processing abandoned carts:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

let schedulerIntervalId = null;

/**
 * Start lightweight background scheduler for abandoned cart check.
 */
const startAbandonedCartScheduler = (intervalMs = 60 * 60 * 1000) => {
  if (schedulerIntervalId) return;

  // Run initial check on server start (non-blocking)
  setTimeout(() => {
    checkAbandonedCarts().catch(err => console.error('Initial abandoned cart scan error:', err));
  }, 10000);

  // Set recurring interval
  schedulerIntervalId = setInterval(() => {
    checkAbandonedCarts().catch(err => console.error('Scheduled abandoned cart scan error:', err));
  }, intervalMs);

  console.log(`Abandoned cart background processor started (Interval: ${intervalMs / 1000}s, Threshold: ${ABANDONED_CART_HOURS}h)`);
};

const stopAbandonedCartScheduler = () => {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
  }
};

module.exports = {
  checkAbandonedCarts,
  startAbandonedCartScheduler,
  stopAbandonedCartScheduler,
  ABANDONED_CART_HOURS
};
