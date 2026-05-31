import { neon, NeonQueryFunction } from '@neondatabase/serverless';

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

// Only create sql client if a database URL exists
let sql: NeonQueryFunction<false, false>;

const databaseUrl = getDatabaseUrl();

if (databaseUrl) {
  sql = neon(databaseUrl);
} else {
  // Create a mock sql function that throws an error
  // This will be caught in the API routes and they'll use mock data
  const mockSql = async () => {
    throw new Error('DATABASE_URL not configured');
  };
  sql = Object.assign(mockSql, {
    transaction: async () => {
      throw new Error('DATABASE_URL not configured');
    },
  }) as unknown as NeonQueryFunction<false, false>;
}

export { sql, getDatabaseUrl };

