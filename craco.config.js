/** @type {import('@craco/craco').CracoConfig} */
module.exports = {
  webpack: {
    configure: (config) => {
      if (!config.resolve.extensions.includes(".ts")) config.resolve.extensions.push(".ts");
      if (!config.resolve.extensions.includes(".tsx")) config.resolve.extensions.push(".tsx");
      return config;
    },
  },
};