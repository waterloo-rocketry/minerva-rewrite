module.exports = {
  apps: [
    {
      name: "minerva",
      script: "node ./bundle.js",
      time: true,
      instances: 1,
      autorestart: true,
      max_restarts: 50,
      watch: false,
    },
  ],
};
