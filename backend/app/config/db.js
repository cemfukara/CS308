// This file configures the connection to the MySQL database using Sequelize.
import mysql from 'mysql2';
import './dotenv.js';

export const db = await mysql.createConnection({
    //Connects to database
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

console.log('MySQL connected'); //Output
