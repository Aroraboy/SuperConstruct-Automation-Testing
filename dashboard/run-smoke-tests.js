const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class SmokeTestRunner {
  constructor() {
    this.testResults = [];
    this.startTime = null;
    this.endTime = null;
  }

  async run() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   SuperConstruct AI Automation Testing Framework     ║');
    console.log('║          ONE-CLICK SMOKE TEST EXECUTION              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    this.startTime = new Date();
    console.log(`🚀 Starting smoke tests at ${this.startTime.toLocaleString()}\n`);

    // Test suites to run
    const testSuites = [
      { name: 'Authentication', path: 'tests/auth/' },
      { name: 'User Management', path: 'tests/modules/users.spec.js' },
      { name: 'Schedule of Values', path: 'tests/modules/sov.spec.js' },
      { name: 'RFI', path: 'tests/modules/rfi.spec.js' },
      { name: 'Submittal', path: 'tests/modules/submittal.spec.js' },
      { name: 'Inspection', path: 'tests/modules/inspection.spec.js' },
      { name: 'Change Request', path: 'tests/modules/change-request.spec.js' }
    ];

    console.log('📋 Test Suites to Execute:');
    testSuites.forEach((suite, index) => {
      console.log(`   ${index + 1}. ${suite.name}`);
    });
    console.log('\n' + '═'.repeat(60) + '\n');

    // Run all tests
    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    this.endTime = new Date();
    this.printSummary();
    this.openReport();
  }

  async runTestSuite(suite) {
    console.log(`\n▶️  Running: ${suite.name}`);
    console.log('─'.repeat(60));

    return new Promise((resolve) => {
      const command = `npx playwright test ${suite.path}`;
      
      const testProcess = exec(command, { 
        cwd: path.join(__dirname, '..'),
        maxBuffer: 10 * 1024 * 1024 
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        output += data;
        process.stdout.write(data);
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data;
      });

      testProcess.on('close', (code) => {
        const result = {
          name: suite.name,
          passed: code === 0,
          output: output,
          error: errorOutput,
          code: code
        };

        this.testResults.push(result);

        if (code === 0) {
          console.log(`✅ ${suite.name} - PASSED\n`);
        } else {
          console.log(`❌ ${suite.name} - FAILED (Exit code: ${code})\n`);
        }

        resolve();
      });
    });
  }

  printSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SMOKE TEST SUMMARY');
    console.log('═'.repeat(60) + '\n');

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => r.passed === false).length;
    const total = this.testResults.length;

    console.log(`Total Test Suites: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    const duration = (this.endTime - this.startTime) / 1000;
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);

    console.log('\n' + '─'.repeat(60) + '\n');

    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const status = result.passed ? 'PASSED' : 'FAILED';
      console.log(`${icon} ${index + 1}. ${result.name} - ${status}`);
    });

    console.log('\n' + '═'.repeat(60) + '\n');

    if (failed === 0) {
      console.log('🎉 All smoke tests passed successfully!');
    } else {
      console.log(`⚠️  ${failed} test suite(s) failed. Please review the report.`);
    }

    console.log('\n📄 Test report generated in: reports/html-report/');
    console.log('💡 Run "npm run report" to view the detailed HTML report\n');
  }

  openReport() {
    console.log('🌐 Opening test report...\n');
    
    // Open the HTML report
    setTimeout(() => {
      exec('npx playwright show-report reports/html-report', (error) => {
        if (error) {
          console.log('ℹ️  Report available at: reports/html-report/index.html');
        }
      });
    }, 2000);
  }
}

// Run the smoke tests
if (require.main === module) {
  const runner = new SmokeTestRunner();
  runner.run().catch(error => {
    console.error('❌ Error running smoke tests:', error);
    process.exit(1);
  });
}

module.exports = SmokeTestRunner;
