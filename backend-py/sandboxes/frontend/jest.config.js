module.exports = {
  rootDir: "/opt/sandbox",
  roots: ["/workspace"],
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.js"],
  modulePaths: ["/opt/sandbox/node_modules"],
  setupFiles: ["/opt/sandbox/jest.setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "/opt/sandbox/babel.config.js" }],
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testTimeout: 10000,
  verbose: false,
};
