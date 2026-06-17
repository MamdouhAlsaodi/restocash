/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/test/**/*.int-spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  testTimeout: 30000,
};
