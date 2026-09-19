const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price image stock badge badgeColor originalPrice discount category');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart or merge guest cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { items } = req.body; // Can accept single item or array of items (for merge)
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemsToAdd = Array.isArray(items) ? items : [req.body];

    for (const newItem of itemsToAdd) {
      const { product, quantity, size } = newItem;

      // Validate product
      const productExists = await Product.findById(product);
      if (!productExists) {
        continue; // Skip invalid products
      }

      if (productExists.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${productExists.name}. Available: ${productExists.stock}`
        });
      }

      // Check if item already exists in cart
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === product.toString() && item.size === size
      );

      if (itemIndex > -1) {
        // Item exists, update quantity
        let newQty = cart.items[itemIndex].quantity + quantity;
        if (newQty > productExists.stock) {
          newQty = productExists.stock; // Cap at max stock
        }
        cart.items[itemIndex].quantity = newQty;
      } else {
        // Add new item
        cart.items.push({ product, quantity, size });
      }
    }

    await cart.save();
    
    cart = await Cart.findById(cart._id).populate('items.product', 'name price image stock badge badgeColor originalPrice discount category');

    res.json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params; // _id of the cart item

    // FIX 4: Validate quantity
    const parsedQty = Number(quantity);
    if (quantity === undefined || quantity === null || isNaN(parsedQty)) {
      return res.status(400).json({ success: false, message: 'quantity must be a number' });
    }
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer (minimum 1)' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const productExists = await Product.findById(item.product);
    if (!productExists) {
      return res.status(404).json({ success: false, message: 'Product no longer exists' });
    }
    if (parsedQty > productExists.stock) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Available: ${productExists.stock}`
      });
    }

    item.quantity = parsedQty;
    await cart.save();
    
    await cart.populate('items.product', 'name price image stock badge badgeColor originalPrice discount category');

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items.pull(itemId);
    await cart.save();
    
    await cart.populate('items.product', 'name price image stock badge badgeColor originalPrice discount category');

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
