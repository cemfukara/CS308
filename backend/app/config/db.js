// This file configures the connection to the MySQL database using Sequelize.
import mysql from 'mysql2/promise';
import './dotenv.js';

export const db = await mysql.createConnection({
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
