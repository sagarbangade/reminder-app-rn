// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
};

module.exports = config;
