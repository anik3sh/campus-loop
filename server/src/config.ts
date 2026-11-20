import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading from server/.env or root .env, safely fallback if not present
const serverEnvPath = path.join(__dirname, '../.env');
const rootEnvPath = path.join(process.cwd(), '.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export const PORT = Number(process.env.PORT) || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'campus_loop_jwt_secret_key_2026';
export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
export const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const NODE_ENV = process.env.NODE_ENV || 'development';
