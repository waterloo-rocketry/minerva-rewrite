module.exports = {
  apps: [
    {
      name: 'minerva-dev',
      script: './bundle.js | rtail --id minerva-dev',
      node_args: '-r dotenv/config',
      time: true,
      instances: 1,
      autorestart: true,
      max_restarts: 50,
      watch: false,
    },
  ],
};
