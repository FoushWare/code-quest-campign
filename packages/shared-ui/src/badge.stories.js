import { Badge } from './badge';

export default {
  title: 'shared-ui/Badge',
  component: Badge,
};

export const Default = {
  args: {
    children: 'Default badge',
  },
};

export const Warning = {
  args: {
    children: 'Warning badge',
    tone: 'warning',
  },
};