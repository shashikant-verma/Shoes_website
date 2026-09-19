const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Helper function to recalculate dynamic aggregate rating for a product
const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: 'APPROVED'
        }
      },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].averageRating * 10) / 10;
      await Product.findByIdAndUpdate(productId, {
        rating: avg,
        reviewCount: stats[0].reviewCount
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewCount: 0
      });
    }
  } catch (error) {
    console.error('Error updating product rating aggregate:', error);
  }
};

// @desc    Get approved reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const reviews = await Review.find({
      product: productId,
      status: 'APPROVED'
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
      sum += r.rating;
    });

    const count = reviews.length;
    const averageRating = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    res.json({
      success: true,
      count,
      summary: {
        averageRating,
        reviewCount: count,
        distribution
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's review & verified purchase status for a product
// @route   GET /api/reviews/my/:productId
// @access  Private
const getMyReview = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if user has purchased this product (verified purchase check)
    const order = await Order.findOne({
      user: req.user._id,
      status: { $ne: 'cancelled' },
      'items.product': productId
    });

    const isVerifiedBuyer = !!order;

    // Find existing user review for this product
    const myReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    res.json({
      success: true,
      isVerifiedBuyer,
      myReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a review (Verified buyers only, 1 per user per product)
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate rating
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Validate comment
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    // Check single review enforcement: user already reviewed this product?
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product. You may edit your existing review.'
      });
    }

    // Verified Buyer Check: Must have a valid non-cancelled order for this product
    const order = await Order.findOne({
      user: req.user._id,
      status: { $ne: 'cancelled' },
      'items.product': productId
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Only verified buyers who have purchased this product can leave a review.'
      });
    }

    // Create review with PENDING status for moderation
    const review = await Review.create({
      user: req.user._id,
      product: productId,
      order: order._id,
      rating: parsedRating,
      title: title ? String(title).trim().substring(0, 100) : '',
      comment: comment.trim(),
      isVerifiedPurchase: true,
      status: 'PENDING'
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Your review has been submitted and is currently awaiting moderation.',
      data: populatedReview
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product.'
      });
    }
    next(error);
  }
};

// @desc    Update user's review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Ownership check
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this review'
      });
    }

    // Validate rating if provided
    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5'
        });
      }
      review.rating = parsedRating;
    }

    if (title !== undefined) {
      review.title = String(title).trim().substring(0, 100);
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot be empty'
        });
      }
      if (comment.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot exceed 1000 characters'
        });
      }
      review.comment = comment.trim();
    }

    // Reset status to PENDING upon edit for re-moderation
    review.status = 'PENDING';
    await review.save();

    // Recalculate product rating since review status changed to PENDING
    await updateProductRating(review.product);

    const updatedReview = await Review.findById(review._id).populate('user', 'name');

    res.json({
      success: true,
      message: 'Review updated successfully and resubmitted for moderation.',
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user's review (or Admin delete)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Ownership or Admin check
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review'
      });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);

    // Recalculate aggregate product rating
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN MODERATION CONTROLLERS ====================

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name image price')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      count: reviews.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve review (Admin)
// @route   PUT /api/reviews/admin/:id/approve
// @access  Private/Admin
const approveReviewAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'APPROVED';
    await review.save();

    // Recalculate product rating aggregate
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Review approved successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject review (Admin)
// @route   PUT /api/reviews/admin/:id/reject
// @access  Private/Admin
const rejectReviewAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'REJECTED';
    await review.save();

    // Recalculate product rating aggregate
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Review rejected',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProductRating,
  getProductReviews,
  getMyReview,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  approveReviewAdmin,
  rejectReviewAdmin
};
