// src/utils/db.ts
import { Pool } from 'pg'; // ignore the error here

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/dbname';


export const pool = new Pool({
    connectionString: connectionString,
    statement_timeout: 5000,          // 5 seconds timeout for each query
    connectionTimeoutMillis: 3000,    // 3 seconds timeout for establishing a connection
    max: 20,                          // Maximum number of connections
    idleTimeoutMillis: 4000,          // 1 second timeout before closing an idle connection
    ssl: {
        rejectUnauthorized: false
    }
});