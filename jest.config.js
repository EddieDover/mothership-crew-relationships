export default {
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!**/node_modules/**",
    "!src/scripts/crew-relationships.js",
    "!src/scripts/constants.js",
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageThreshold: {
    global: {
      lines: 95,
    },
  },
};
