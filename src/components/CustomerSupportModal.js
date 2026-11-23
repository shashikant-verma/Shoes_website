import React from 'react';
import './CustomerSupportModal.css';

function CustomerSupportModal({ topic = 'faq', onClose }) {
  if (!topic) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="support-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        {topic === 'faq' && (
          <div className="support-content">
            <h2 className="headline-md">FREQUENTLY ASKED QUESTIONS (FAQ)</h2>
            <div className="faq-list">
              <div className="faq-item">
                <h4>Q: How do I choose the correct shoe size?</h4>
                <p>A: Check our integrated Size Guide on any product details page. SoleVibe shoes run true to standard UK sizing.</p>
              </div>
              <div className="faq-item">
                <h4>Q: What are your payment options?</h4>
                <p>A: We accept all major Credit/Debit Cards, NetBanking, UPI via Razorpay, as well as Cash on Delivery (COD).</p>
              </div>
              <div className="faq-item">
                <h4>Q: How long does delivery take?</h4>
                <p>A: Standard shipping takes 3-5 business days across India. Express options arrive within 48 hours in metro cities.</p>
              </div>
              <div className="faq-item">
                <h4>Q: How do I initiate a return or exchange?</h4>
                <p>A: Navigate to your Account ➔ Order History, select the delivered order, and click "Initiate Return".</p>
              </div>
            </div>
          </div>
        )}

        {topic === 'shipping' && (
          <div className="support-content">
            <h2 className="headline-md">SHIPPING & DELIVERY POLICY</h2>
            <p>SoleVibe provides fast and secure shipping nationwide across India.</p>
            <ul className="policy-bullet-list">
              <li><strong>Free Shipping Threshold:</strong> Orders above ₹15,000 qualify for 100% FREE Standard Shipping. Orders below threshold incur a standard ₹150 delivery charge.</li>
              <li><strong>Express Courier Option:</strong> Express courier delivery is available for ₹350 with expedited 1-2 business day dispatch.</li>
              <li><strong>Standard Delivery SLA:</strong> Orders are dispatched within 24 hours and delivered in 3-5 business days.</li>
              <li><strong>Order Tracking:</strong> Live real-time tracking is provided for every order in your Order History.</li>
              <li><strong>Secure Packaging:</strong> Every pair is shipped in eco-conscious, impact-resistant protective boxes.</li>
            </ul>
          </div>
        )}

        {topic === 'returns' && (
          <div className="support-content">
            <h2 className="headline-md">RETURNS & REFUNDS POLICY</h2>
            <p>We want you to love your SoleVibe footwear. If it's not the perfect fit, we make returns simple.</p>
            <ul className="policy-bullet-list">
              <li><strong>7-Day Return Policy:</strong> You may request a return within 7 days of order delivery.</li>
              <li><strong>Condition Requirement:</strong> Items must be unworn, undamaged, with original tags and packaging intact.</li>
              <li><strong>Hassle-Free Doorstep Pickup:</strong> Our courier partners will pick up the item directly from your address.</li>
              <li><strong>Secure Refund Processing:</strong> Once verified by our warehouse team, refunds are processed back to your original payment method.</li>
            </ul>
          </div>
        )}

        {topic === 'contact' && (
          <div className="support-content">
            <h2 className="headline-md">CONTACT US & SUPPORT</h2>
            <p>Have questions or need assistance with an order? Our customer experience team is here for you.</p>
            <div className="contact-details-grid">
              <div className="contact-card">
                <span className="contact-icon">📧</span>
                <h4>Email Support</h4>
                <p>support@solevibe.com</p>
              </div>
              <div className="contact-card">
                <span className="contact-icon">📞</span>
                <h4>Phone Support</h4>
                <p>+91 1800-765-3842 (Mon-Sat, 9am - 7pm)</p>
              </div>
              <div className="contact-card">
                <span className="contact-icon">📍</span>
                <h4>Headquarters</h4>
                <p>SoleVibe Footwear Tower, Bandra Kurla Complex, Mumbai, India</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerSupportModal;
