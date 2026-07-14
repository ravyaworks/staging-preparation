-- Database initialization script
-- Run on first database creation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS "public";

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
