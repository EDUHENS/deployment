// debug-app.js
console.log('Starting detailed debug...');
console.log('Current directory:', process.cwd());

// 加載環境變數
require('dotenv').config();
console.log('Environment variables loaded');

// 檢查關鍵環境變數
console.log(' Key environment variables:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('  PORT:', process.env.PORT);

try {
  console.log('Attempting to load app.js...');
  const app = require('./src/app.js');
  console.log('app.js loaded successfully');
  
  // 檢查 app 是否正確導出
  console.log('app export type:', typeof app);
  console.log('app has listen method:', typeof app.listen === 'function');
  
} catch (error) {
  console.error(' Failed to load app.js:');
  console.error(error);
  process.exit(1);
}

console.log(' Debug completed');