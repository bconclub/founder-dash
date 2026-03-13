module.exports = {
  apps: [{
    name: 'bcon-voice',
    script: 'server.js',
    env_file: '.env',
    env: { NODE_ENV: 'production' }
  }]
};
