module.exports = {
  apps: [
    {
      name: 'minerva-dev',
      script: 'node ./bundle.js 2>&1 | rtail --id minerva-dev',
      time: true,
      instances: 1,
      autorestart: true,
      max_restarts: 50,
      watch: false,
    },
  ],
};
