module.exports = {
  apps: [
    {
      name: "projectHubApp",
      script: "./dist/index.js",
      instances: 1,

      // Logging
      out_file: "./out.log",
      error_file: "./error.log",
      merge_logs: true,
      log_type: "json",

      env_blue: {
        CLOUD_FRONT_BASE_URL: "https://1234356645654putyournumber.cloudfront.net",
        PORT: 3001,
      },
      env_green: {
        CLOUD_FRONT_BASE_URL: "https://1234356645654putyournumber.cloudfront.net",
        PORT: 3000,
      },
    },
  ],
};
