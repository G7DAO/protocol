// src/utils/db.ts
import { Pool } from 'pg'; // ignore the error here

const connectionString = process.env.PROTOCOL_API_MOONSTREAM_V3_LABELS_DATABASE_URI || 'postgres://user:password@localhost:5432/dbname';


export const pool = new Pool({
    connectionString: connectionString,
    statement_timeout: 10000,          // 5 seconds timeout for each query
    connectionTimeoutMillis: 3000,    // 3 seconds timeout for establishing a connection
    max: 100,                          // Maximum number of connections
    idleTimeoutMillis: 4000,          // 1 second timeout before closing an idle connection
    ssl: {
        rejectUnauthorized: false
    }
});