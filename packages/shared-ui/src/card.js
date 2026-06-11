import React from 'react';

function cardSurface(style) {
  return {
    background: 'rgba(15, 23, 42, 0.82)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(2, 6, 23, 0.35)',
    backdropFilter: 'blur(18px)',
    color: '#e2e8f0',
    ...style,
  };
}

export function Card({ children, style }) {
  return React.createElement('section', { style: cardSurface(style), children });
}

export function CardHeader({ children, style }) {
  return React.createElement('header', { style: { padding: 24, paddingBottom: 0, ...style }, children });
}

export function CardTitle({ children, style }) {
  return React.createElement('h2', { style: { margin: 0, fontSize: 28, lineHeight: 1.1, ...style }, children });
}

export function CardDescription({ children, style }) {
  return React.createElement('p', {
    style: {
      color: '#94a3b8',
      fontSize: 14,
      lineHeight: 1.7,
      margin: '10px 0 0',
      ...style,
    },
    children,
  });
}

export function CardContent({ children, style }) {
  return React.createElement('div', { style: { padding: 24, ...style }, children });
}

export function CardFooter({ children, style }) {
  return React.createElement('footer', { style: { padding: '0 24px 24px', ...style }, children });
}