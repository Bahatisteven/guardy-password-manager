import { TestEnvironment } from "jest-environment-node";

export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  //extensionsToTreatAsEsm: [".js"],
};