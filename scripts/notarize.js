#!/usr/bin/env node

/**
 * macOS Notarization Script for Oyren
 * 
 * This script handles the notarization process for macOS builds.
 * It requires the following environment variables:
 * - APPLE_ID: Your Apple Developer ID
 * - APPLE_PASSWORD: App-specific password for notarization
 * - APPLE_TEAM_ID: Your Apple Team ID
 * 
 * Usage: node scripts/notarize.js <path-to-app>
 */

const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

async function notarizeApp() {
  // Check for required environment variables
  const requiredEnvVars = ['APPLE_ID', 'APPLE_PASSWORD', 'APPLE_TEAM_ID'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please set these variables before running notarization.');
    process.exit(1);
  }

  // Get the app path from command line arguments
  const appPath = process.argv[2];
  
  if (!appPath) {
    console.error('❌ No app path provided.');
    console.error('Usage: node scripts/notarize.js <path-to-app>');
    process.exit(1);
  }

  // Verify the app exists
  if (!fs.existsSync(appPath)) {
    console.error(`❌ App not found at path: ${appPath}`);
    process.exit(1);
  }

  console.log('🍎 Starting macOS notarization process...');
  console.log(`📦 App path: ${appPath}`);
  console.log(`👤 Apple ID: ${process.env.APPLE_ID}`);
  console.log(`👥 Team ID: ${process.env.APPLE_TEAM_ID}`);

  try {
    await notarize({
      appBundleId: 'com.oyren.app',
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log('✅ Notarization successful!');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    process.exit(1);
  }
}

// Run the notarization
notarizeApp();