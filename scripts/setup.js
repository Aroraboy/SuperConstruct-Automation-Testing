const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = [
  'reports',
  'reports/html-report',
  'reports/screenshots',
  'reports/videos',
  'reports/traces'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from .env.example');
  console.log('⚠️  Please update .env with your actual configuration');
}

console.log('\n✨ Setup complete! Next steps:');
console.log('1. Run: npm run install:browsers');
console.log('2. Update config/test.config.json with your app URL and credentials');
console.log('3. Run: npm run test:smoke');
console.log('\nOr start the dashboard: npm run dashboard\n');
