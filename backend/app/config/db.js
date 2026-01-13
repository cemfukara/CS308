// This file configures the connection to the MySQL database using Sequelize.
import mysql from 'mysql2/promise';
import './dotenv.js';

export let db;

try {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    // In test environment, do not connect. Mocks should handle this.
    // If a test hits this, it means mocking failed, but at least we don't hang.
    console.log('Test environment: Skipping real DB connection in db.js');
    db = {
      query: async () => { throw new Error('DB not mocked in test!'); }
    };
  } else {
    db = await mysql.createConnection({
      //Connects to database
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('MySQL connected'); //Output
  }
} catch (error) {
  console.error('Database connection failed:', error.message);
  // Continue to allow app to start, but db calls will fail
}
