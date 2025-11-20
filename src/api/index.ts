import * as dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true });

import { createServer } from '../lib/server';

const PORT = process.env.TR_PORT ? parseInt(process.env.TR_PORT, 10) : 8282;

createServer(PORT);
