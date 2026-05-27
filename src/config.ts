import { config } from 'dotenv';
config();

export const env = {
  PORT: process.env.PORT,
  FRANKFURTER_API_URL: process.env.FRANKFURTER_API_URL,
  // FALLBACK_RATE_USD_PEN: parseFloat(process.env.FALLBACK_RATE_USD_PEN || '3.75'),
};
