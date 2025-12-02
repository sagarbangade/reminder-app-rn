module.exports = ({ config }) => {
  return {
    ...config,
    web: {
      ...config.web,
      bundler: 'metro',
    },
  };
};
