import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Only create sql client if DATABASE_URL exists
let sql: NeonQueryFunction<false, false>;

if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
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

export { sql };

