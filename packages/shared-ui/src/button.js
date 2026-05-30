import React from 'react';

const buttonStyles = {
  default: {
    background:
      'linear-gradient(180deg, rgba(74, 222, 128, 1) 0%, rgba(34, 197, 94, 1) 100%)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
    color: '#06240f',
  },
  secondary: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(148, 163, 184, 0.22)',
    color: '#e2e8f0',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: '#cbd5e1',
  },
};

export function Button({ children, variant = 'default', style, ...props }) {
  return React.createElement('button', {
    ...props,
    style: {
      alignItems: 'center',
      borderRadius: 16,
      border: '1px solid',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.22)',
      cursor: 'pointer',
      display: 'inline-flex',
      fontSize: 14,
      fontWeight: 700,
      gap: 8,
      justifyContent: 'center',
      minHeight: 44,
      padding: '0 16px',
      transition: 'transform 160ms ease, opacity 160ms ease',
      ...buttonStyles[variant],
      ...style,
    },
    children,
  });
}