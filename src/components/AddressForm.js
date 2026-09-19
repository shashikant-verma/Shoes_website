import React, { useState, useEffect } from 'react';
import './AddressBook.css'; // Will share styles with AddressBook

function AddressForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'HOME',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal Code is required';
    } else if (!/^[A-Za-z0-9\s-]{4,10}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Please enter a valid postal code';
    }
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      <div className="form-group-inline">
        <div className="form-group">
          <label>Address Type</label>
          <div className="address-type-selector">
            {['HOME', 'OFFICE', 'OTHER'].map(type => (
              <button
                type="button"
                key={type}
                className={`type-btn ${formData.type === type ? 'active' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: type } })}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Full Name *</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className={errors.fullName ? 'error' : ''}
          placeholder="Enter full name"
        />
        {errors.fullName && <span className="error-text">{errors.fullName}</span>}
      </div>

      <div className="form-group">
        <label>Phone Number *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={errors.phone ? 'error' : ''}
          placeholder="Enter phone number"
        />
        {errors.phone && <span className="error-text">{errors.phone}</span>}
      </div>

      <div className="form-group">
        <label>Address Line 1 *</label>
        <input
          type="text"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
          className={errors.addressLine1 ? 'error' : ''}
          placeholder="Street address, P.O. box, company name, c/o"
        />
        {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
      </div>

      <div className="form-group">
        <label>Address Line 2 (Optional)</label>
        <input
          type="text"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={handleChange}
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
      </div>

      <div className="form-group">
        <label>Landmark (Optional)</label>
        <input
          type="text"
          name="landmark"
          value={formData.landmark}
          onChange={handleChange}
          placeholder="E.g. Near Apollo Hospital"
        />
      </div>

      <div className="form-group-inline">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={errors.city ? 'error' : ''}
            placeholder="City"
          />
          {errors.city && <span className="error-text">{errors.city}</span>}
        </div>
        <div className="form-group">
          <label>State / Province *</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={errors.state ? 'error' : ''}
            placeholder="State"
          />
          {errors.state && <span className="error-text">{errors.state}</span>}
        </div>
      </div>

      <div className="form-group-inline">
        <div className="form-group">
          <label>Postal Code *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className={errors.postalCode ? 'error' : ''}
            placeholder="ZIP / Postal Code"
          />
          {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
        </div>
        <div className="form-group">
          <label>Country *</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className={errors.country ? 'error' : ''}
            placeholder="Country"
          />
          {errors.country && <span className="error-text">{errors.country}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}

export default AddressForm;
