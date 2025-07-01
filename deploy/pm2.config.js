module.exports = {
  apps: [{
    name: 'nfc-home-manager',
    script: 'backend/src/server.js',
    cwd: '/var/www/nfc-home-manager',
    
    // 实例配置
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日志配置
    log_file: '/var/www/nfc-home-manager/logs/combined.log',
    out_file: '/var/www/nfc-home-manager/logs/out.log',
    error_file: '/var/www/nfc-home-manager/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 自动重启配置
    watch: false, // 生产环境建议设为false
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_memory_restart: '500M',
    
    // 重启策略
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 其他配置
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000
  }]
}; 