const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Run smoke tests
app.post('/run-tests', async (req, res) => {
  const { appUrl, testEmail, testPassword } = req.body;

  // Update config if provided
  if (appUrl || testEmail || testPassword) {
    const configPath = path.join(__dirname, '../config/test.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (appUrl) config.app.webUrl = appUrl;
    if (testEmail) config.testUser.email = testEmail;
    if (testPassword) config.testUser.password = testPassword;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  // Run the smoke tests
  const testCommand = 'npm run test:smoke';
  
  exec(testCommand, { 
    cwd: path.join(__dirname, '..'),
    maxBuffer: 10 * 1024 * 1024
  }, (error, stdout, stderr) => {
    // Parse results
    const passed = !error;
    
    res.json({
      success: passed,
      passed: passed ? 'All' : 'Some',
      failed: passed ? 0 : 'Some',
      output: stdout,
      error: stderr
    });
  });
});

// Serve test report
app.get('/report', (req, res) => {
  const reportPath = path.join(__dirname, '../reports/html-report/index.html');
  
  if (fs.existsSync(reportPath)) {
    res.sendFile(reportPath);
  } else {
    res.status(404).send('No test report available. Please run tests first.');
  }
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   SuperConstruct AI Testing Dashboard                 ║
║                                                       ║
║   🌐 Dashboard running at:                           ║
║   http://localhost:${PORT}                                  ║
║                                                       ║
║   Open this URL in your browser to:                  ║
║   - Configure test settings                          ║
║   - Run smoke tests with one click                   ║
║   - View detailed test reports                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
