import { Button } from './button';

export default {
  title: 'shared-ui/Button',
  component: Button,
};

export const Primary = {
  args: {
    children: 'Primary action',
  },
};

export const Secondary = {
  args: {
    children: 'Secondary action',
    variant: 'secondary',
  },
};