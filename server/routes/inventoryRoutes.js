const express = require('express');
const router = express.Router();
const {
  getInventory,
  getLowStockProducts,
  getProductInventory,
  adjustStock,
  getInventoryHistory
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All inventory routes require Admin authentication
router.use(authenticate, authorize('ADMIN'));

router.get('/', getInventory);
router.get('/low-stock', getLowStockProducts);
router.get('/:productId', getProductInventory);
router.post('/:productId/adjust', adjustStock);
router.put('/:productId', adjustStock);
router.get('/:productId/history', getInventoryHistory);

module.exports = router;
