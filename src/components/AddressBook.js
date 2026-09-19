import React, { useState, useEffect } from 'react';
import './AddressBook.css';
import addressService from '../services/addressService';
import AddressForm from './AddressForm';

function AddressBook({ showToast }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    const result = await addressService.getAddresses();
    if (result.success) {
      setAddresses(result.data);
    } else {
      showToast && showToast(result.message || 'Failed to load addresses', 'error');
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const result = await addressService.deleteAddress(id);
      if (result.success) {
        showToast && showToast('Address deleted successfully', 'success');
        loadAddresses();
      } else {
        showToast && showToast(result.message || 'Failed to delete address', 'error');
      }
    }
  };

  const handleSetDefault = async (id) => {
    const result = await addressService.setDefaultAddress(id);
    if (result.success) {
      showToast && showToast('Default address updated', 'success');
      setAddresses(result.data);
    } else {
      showToast && showToast(result.message || 'Failed to update default address', 'error');
    }
  };

  const handleSubmit = async (formData) => {
    if (submitting) return;
    setSubmitting(true);

    let result;
    if (editingAddress) {
      result = await addressService.updateAddress(editingAddress._id, formData);
    } else {
      result = await addressService.createAddress(formData);
    }

    if (result.success) {
      showToast && showToast(editingAddress ? 'Address updated successfully' : 'Address added successfully', 'success');
      setIsFormOpen(false);
      loadAddresses();
    } else {
      showToast && showToast(result.message || 'Failed to save address', 'error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="address-book-container">
        <div className="loading-state">Loading addresses...</div>
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <div className="address-book-container">
        <div className="address-book-header">
          <h2 className="headline-lg">{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
        </div>
        <AddressForm 
          initialData={editingAddress}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="address-book-container">
      <div className="address-book-header">
        <h2 className="headline-lg">My Addresses</h2>
        <button className="btn-primary" onClick={handleAddNew}>+ Add New Address</button>
      </div>

      {addresses.length === 0 ? (
        <div className="address-empty-state">
          <div className="empty-icon">📍</div>
          <h3>No saved addresses yet</h3>
          <p>Add your first delivery address</p>
          <button className="btn-secondary" onClick={handleAddNew}>Add Address</button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((address) => (
            <div key={address._id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
              {address.isDefault && <span className="default-badge">DEFAULT</span>}
              <div className="address-type">{address.type}</div>
              <h3 className="address-name">{address.fullName}</h3>
              <p className="address-phone">{address.phone}</p>
              <div className="address-details">
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                {address.landmark && <p>Landmark: {address.landmark}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}</p>
              </div>
              <div className="address-actions">
                <button className="btn-text" onClick={() => handleEdit(address)}>Edit</button>
                <button className="btn-text danger" onClick={() => handleDelete(address._id)}>Delete</button>
                {!address.isDefault && (
                  <button className="btn-text" onClick={() => handleSetDefault(address._id)}>Set as Default</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressBook;
