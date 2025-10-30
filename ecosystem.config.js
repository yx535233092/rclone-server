module.exports = {
  apps: [
    {
      name: "rclone-server",
      script: "./bin/www",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
