// test-connection.js
require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'MISSING');
// test-db-import.js
console.log('Testing database/index.js import...');
try {
  const db = require('./src/database/index.js');
  console.log('Database module loaded successfully');
} catch (error) {
  console.error('Error loading database module:', error);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version.split('\n')[0]);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === '28P01') {
      console.error('💡 Password authentication failed');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - is PostgreSQL running?');
    }
    
    process.exit(1);
  }
}

test();