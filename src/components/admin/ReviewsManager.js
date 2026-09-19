import React, { useState, useEffect, useCallback } from 'react';
import reviewService from '../../services/reviewService';
import './ReviewsManager.css';

function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = activeTab === 'ALL' ? {} : { status: activeTab };
    const res = await reviewService.getAllReviewsAdmin(params);
    if (res.success) {
      setReviews(res.data || []);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to load reviews' });
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    const res = await reviewService.approveReviewAdmin(id);
    setActionLoading(null);
    if (res.success) {
      setMessage({ type: 'success', text: 'Review approved successfully' });
      fetchReviews();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to approve review' });
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    const res = await reviewService.rejectReviewAdmin(id);
    setActionLoading(null);
    if (res.success) {
      setMessage({ type: 'success', text: 'Review rejected' });
      fetchReviews();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to reject review' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review permanently?')) {
      setActionLoading(id);
      const res = await reviewService.deleteReview(id);
      setActionLoading(null);
      if (res.success) {
        setMessage({ type: 'success', text: 'Review deleted' });
        fetchReviews();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to delete review' });
      }
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="reviews-manager-container">
      <div className="reviews-manager-header">
        <div>
          <h2>Product Reviews Moderation</h2>
          <p>Review, approve, reject, or manage customer product reviews</p>
        </div>
      </div>

      {message.text && (
        <div className={`manager-alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="status-filter-tabs">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="reviews-table-wrapper">
        {loading ? (
          <div className="loading-spinner-box">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-reviews-box">No {activeTab.toLowerCase()} reviews found.</div>
        ) : (
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review Content</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((rev) => (
                <tr key={rev._id}>
                  <td className="col-product">
                    {rev.product ? (
                      <div className="admin-product-cell">
                        <img src={rev.product.image} alt={rev.product.name} className="admin-product-thumb" />
                        <span>{rev.product.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted">Deleted Product</span>
                    )}
                  </td>
                  <td className="col-reviewer">
                    <div className="reviewer-info">
                      <span className="name">{rev.user?.name || 'Unknown User'}</span>
                      <span className="email">{rev.user?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="col-rating">
                    <span className="admin-stars">{renderStars(rev.rating)}</span>
                  </td>
                  <td className="col-comment">
                    {rev.title && <strong>{rev.title}<br /></strong>}
                    <span>{rev.comment}</span>
                  </td>
                  <td className="col-verified">
                    {rev.isVerifiedPurchase ? (
                      <span className="badge-verified-yes">✓ Verified</span>
                    ) : (
                      <span className="badge-verified-no">No</span>
                    )}
                  </td>
                  <td className="col-status">
                    <span className={`admin-status-pill pill-${rev.status.toLowerCase()}`}>
                      {rev.status}
                    </span>
                  </td>
                  <td className="col-date">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons-group">
                      {rev.status !== 'APPROVED' && (
                        <button
                          className="btn-action approve"
                          onClick={() => handleApprove(rev._id)}
                          disabled={actionLoading === rev._id}
                        >
                          Approve
                        </button>
                      )}
                      {rev.status !== 'REJECTED' && (
                        <button
                          className="btn-action reject"
                          onClick={() => handleReject(rev._id)}
                          disabled={actionLoading === rev._id}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(rev._id)}
                        disabled={actionLoading === rev._id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ReviewsManager;
