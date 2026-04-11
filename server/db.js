import sql from 'mssql/msnodesqlv8.js';

const config = {
  connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=localhost\\SQLEXPRESS;Database=PersonalFinancialTracker;Trusted_Connection=Yes;Encrypt=no;`,
};

let pool;

export async function getPool() {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
  }
  return pool;
}

export { sql };
