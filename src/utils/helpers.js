// Format date string to readable format
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format currency
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate a unique ID
export const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Calculate total value of stock
export const calculateStockValue = (products) => {
  return products.reduce((total, product) => {
    return total + (product.stock * product.mrp);
  }, 0);
};

// Constants
export const UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack'];

export const COLORS = {
  primary: '#4a80f5',
  secondary: '#f55e4a',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  light: '#f5f5f5',
  dark: '#333333',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#EEEEEE',
};