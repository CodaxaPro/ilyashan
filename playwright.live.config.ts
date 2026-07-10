import baseConfig from "./playwright.config";

export default {
  ...baseConfig,
  webServer: undefined,
  use: {
    ...baseConfig.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://ilyashan.de",
  },
};
