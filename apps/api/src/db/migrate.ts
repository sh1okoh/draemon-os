import { pool } from './pg';
import { migrationSql } from './sql';

async function main(): Promise<void> {
  await pool.query(migrationSql);
  console.log('migration completed');
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
