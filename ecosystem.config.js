module.exports = {
  apps: [
    {
      name: "malicc-api",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
