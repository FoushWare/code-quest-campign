import React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

export default {
  title: 'shared-ui/Card',
  component: Card,
};

export const Default = {
  render: () =>
    React.createElement(
      Card,
      null,
      React.createElement(
        CardHeader,
        null,
        React.createElement(Badge, { tone: 'success', children: 'Starter card' }),
        React.createElement('div', { style: { height: 12 } }),
        React.createElement(CardTitle, { children: 'Storybook starter template' }),
        React.createElement(CardDescription, {
          children: 'Use this as the basis for future shared UI components.',
        })
      ),
      React.createElement(
        CardContent,
        null,
        React.createElement(
          'div',
          { style: { color: '#94a3b8', lineHeight: 1.7 } },
          'The shared UI package is intentionally small and composable so web and admin can reuse it.'
        )
      ),
      React.createElement(
        CardFooter,
        null,
        React.createElement(Button, { children: 'Continue' })
      )
    ),
};