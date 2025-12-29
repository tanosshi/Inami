const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { FileStore } = require("metro-cache");

const config = getDefaultConfig(__dirname);

const root =
  process.env.METRO_CACHE_ROOT || path.join(__dirname, ".metro-cache");
config.cacheStores = [new FileStore({ root: path.join(root, "cache") })];

config.maxWorkers = 2;

config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver?.alias,
    "@constants/themes": path.resolve(__dirname, "constants/themes"),
  },
};

module.exports = config;
