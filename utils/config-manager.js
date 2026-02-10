/**
 * CONFIGURATION MANAGER
 * 
 * Loads and manages test configuration from config/test.config.json
 * Provides dot-notation access to nested configuration values
 * 
 * Usage:
 *   const config = require('../utils/config-manager');
 *   config.get('app.webUrl')           // Get app URL
 *   config.getTestUser()               // Get test user credentials
 *   config.getAppUrl()                 // Get base app URL
 * 
 * Configuration structure:
 *   - app: Application URLs and endpoints
 *   - testUser: Primary test account credentials
 *   - newUser: Test account for signup tests
 *   - timeouts: Test timeout values
 *   - testData: Test data for various modules
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  /**
   * Initialize configuration from config/test.config.json
   */
  constructor() {
    this.configPath = path.join(__dirname, '../config/test.config.json');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration file
   * @throws {Error} If config file cannot be read or parsed
   */
  loadConfig() {
    try {
      const configFile = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configFile);
    } catch (error) {
      console.error('Error loading config:', error);
      throw new Error('Failed to load test configuration');
    }
  }

  /**
   * Get configuration value using dot notation
   * @param {string} key - Configuration key (e.g., 'app.webUrl', 'testUser.email')
   * @returns {*} Configuration value or undefined if not found
   */
  get(key) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Get application base URL
   * @returns {string} Base URL of the application
   */
  getAppUrl() {
    return this.get('app.webUrl');
  }

  /**
   * Get primary test user credentials
   * @returns {Object} Test user object with email, password, etc.
   */
  getTestUser() {
    return this.get('testUser');
  }

  getNewUser() {
    return this.get('newUser');
  }

  getTimeout(type = 'medium') {
    return this.get(`timeouts.${type}`);
  }

  getTestData(module) {
    return this.get(`testData.${module}`);
  }

  isAIEnabled() {
    return this.get('ai.enabled');
  }

  getAIConfig() {
    return this.get('ai');
  }
}

module.exports = new ConfigManager();
