// This is a minimal mock for pino to make WalletConnect work in the browser
const noop = () => {};

const logger = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  fatal: noop,
  silent: noop,
  child: () => logger
};

// Mock the pino exports
export const levels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: 100
};

// Default export (the main logger function)
export default function() {
  return logger;
}

// Named exports
export const destination = noop;
export const transport = noop;
export const multistream = noop;
export const pretty = noop;
export const final = noop;
export const stdSerializers = {};
export const stdTimeFunctions = {};
export const symbols = {};
export const version = '0.0.0';
