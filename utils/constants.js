/**
 * CONSTANTS & CONFIGURATION
 * 
 * Centralized constants used across the test suite
 * Reduces magic numbers and hardcoded values
 */

// ============================================
// TIMEOUTS (in milliseconds)
// ============================================
const TIMEOUTS = {
  SHORT: 5000,           // Quick operations
  MEDIUM: 15000,         // Normal operations
  LONG: 30000,           // Navigation with load
  EXTRA_LONG: 60000,     // Complex pages
  NAVIGATION_WAIT: 2000, // Wait after navigation
};

// ============================================
// PAGE LOAD STRATEGIES
// ============================================
const LOAD_STRATEGIES = {
  DOM_READY: 'domcontentloaded',  // Fast, DOM is ready
  LOAD: 'load',                    // Medium, page resources loaded
  NETWORK_IDLE: 'networkidle',     // Slow, all network activity complete
};

// ============================================
// PROJECT IDS
// ============================================
const PROJECT_IDS = {
  TEST_PROJECT: '24939171-2ea4-4f4f-b283-3462b4e4b307',
};

// ============================================
// MODULE PATHS
// ============================================
const MODULES = {
  OVERVIEW: '/tools/overview',
  MEMBERS: '/tools/members',
  SOV: '/tools/sov',
  DAILY_LOGS: '/tools/daily-logs',
  RFI: '/tools/rfi',
  QUALITY_CHECK: '/tools/quality-check',
  CHANGE_REQUESTS: '/tools/change-requests',
  INSPECTIONS: '/tools/inspections',
  SUBMITTALS: '/tools/submittals',
  SCHEDULING: '/tools/scheduling',
  DOCUMENTS: '/tools/documents',
  PAY_APPS: '/tools/pay-apps',
  EXPENSES: '/tools/expenses',
  MESSAGE_BOARD: '/tools/message-board',
};

// ============================================
// TEST DATA CONSTRAINTS
// ============================================
const CONSTRAINTS = {
  MIN_PAGE_CONTENT_LENGTH: 500,      // Minimum characters expected on page
  MAX_RETRIES: 2,                     // Retry attempts for flaky tests
  LONG_TEXT_LENGTH: 1000,             // Long text for edge case testing
};

// ============================================
// AUTHENTICATION
// ============================================
const AUTH = {
  AUTH_STATE_FILE: '.auth/user.json',
  STORAGE_STATE_KEY: 'storageState',
};

// ============================================
// LOG LEVELS
// ============================================
const LOG_LEVELS = {
  INFO: '[NOTE]',
  SUCCESS: '[OK]',
  ERROR: '[ERROR]',
  WARNING: '[WARNING]',
  DEBUG: '[DEBUG]',
  TEST: '[TEST]',
  AUTH: '[LOCK]',
  TIMING: '[TIME]',
};

module.exports = {
  TIMEOUTS,
  LOAD_STRATEGIES,
  PROJECT_IDS,
  MODULES,
  CONSTRAINTS,
  AUTH,
  LOG_LEVELS,
};

