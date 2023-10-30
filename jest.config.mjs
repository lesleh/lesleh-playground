import presets from "ts-jest/presets/index.js";
const { defaultsESM } = presets;

for (const key of Object.keys(defaultsESM.transform)) {
  defaultsESM.transform[key][1].tsconfig = "<rootDir>/tsconfig.test.json";
}

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  testEnvironment: "@happy-dom/jest-environment",
  extensionsToTreatAsEsm: defaultsESM.extensionsToTreatAsEsm,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    ...defaultsESM.transform,
  },
};

export default config;
