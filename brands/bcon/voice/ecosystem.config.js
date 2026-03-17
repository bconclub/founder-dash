module.exports = {
  apps: [
    {
      name: 'bcon-voice',
      script: 'server.js',
      env_file: '.env',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'bcon-tasks',
      script: 'task-worker.js',
      cron_restart: '*/5 * * * *',
      autorestart: false,
      env_file: '.env',
      env: { NODE_ENV: 'production' }
    }
  ]
};
