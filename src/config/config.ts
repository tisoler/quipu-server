
import { config } from 'dotenv';
config();

export const PORT = process.env.PORT || 3009;
export const DATA_BASE_HOST= process.env.DATA_BASE_HOST || null;
export const DATA_BASE_PORT= process.env.DATA_BASE_PORT || null;
export const DATA_BASE_USER= process.env.DATA_BASE_USER || null;
export const DATA_BASE_PASSWORD= process.env.DATA_BASE_PASSWORD || null;
export const DATA_BASE = process.env.DATA_BASE || null;
