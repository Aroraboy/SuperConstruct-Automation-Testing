# SuperConstruct AI Automation Testing Framework

## Overview

This is an AI-powered automation testing framework for SuperConstruct mobile and web applications. It performs comprehensive smoke tests with a single button click.

## Features

- AI-powered test generation and execution
- One-click test execution
- Comprehensive smoke tests for all major modules
- Screenshot capture on failures
- Detailed HTML test reports
- Support for both web and mobile testing

## Test Coverage

- Authentication: Login, Logout, Sign In/Sign Up
- User Management: Create Users
- Schedule of Values: Create SOV
- RFI: Create Request for Information
- Submittal: Create Submittal
- Inspection: Create Inspection
- Change Request: Create Change Request

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

Edit `config/test.config.json` to set your application URLs and test credentials.

## Running Tests

### One-Click Smoke Test (All Tests)

```bash
npm run test:smoke
```

### Run Specific Test Suites

```bash
npm run test:auth          # Authentication tests
npm run test:users         # User management tests
npm run test:modules       # All module creation tests
```

### View Test Report

```bash
npm run report
```

## AI Features

- Intelligent element detection
- Auto-healing selectors
- Smart wait strategies
- Context-aware assertions

## Project Structure

```
├── tests/                  # Test files
│   ├── auth/              # Authentication tests
│   ├── modules/           # Module creation tests
│   └── ai/                # AI-powered test utilities
├── pages/                 # Page Object Models
├── config/                # Configuration files
├── utils/                 # Helper utilities
├── reports/               # Test reports
└── dashboard/             # One-click dashboard
```

## Test Results

Test results are automatically generated in the `reports/` directory with:

- HTML report with screenshots
- JSON report for CI/CD integration
- Trace files for debugging

## Troubleshooting

- Ensure the application URLs are correctly configured
- Check that test credentials are valid
- Review screenshots in the reports folder for failed tests
