module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
};