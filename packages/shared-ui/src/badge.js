import React from 'react';

const badgeStyles = {
  default: {
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
    color: '#b6f5d0',
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderColor: 'rgba(34, 197, 94, 0.45)',
    color: '#bbf7d0',
  },
  warning: {
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderColor: 'rgba(250, 204, 21, 0.4)',
    color: '#fde68a',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    color: '#e2e8f0',
  },
};

export function Badge({ children, tone = 'default' }) {
  return React.createElement('span', {
    style: {
      alignItems: 'center',
      borderRadius: 999,
      border: '1px solid',
      display: 'inline-flex',
      fontSize: 12,
      fontWeight: 700,
      gap: 6,
      letterSpacing: 0.08,
      lineHeight: 1,
      padding: '6px 10px',
      width: 'fit-content',
      ...badgeStyles[tone],
    },
    children,
  });
}