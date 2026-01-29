#!/usr/bin/env node
/**
 * Build script with timing and performance logging
 * Identifies build bottlenecks and logs performance metrics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_START = Date.now();
const TIMING_LOG = [];

function logStep(step, fn) {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  TIMING_LOG.push({ step, duration, timestamp: new Date().toISOString() });
  console.log(`⏱️  ${step}: ${(duration / 1000).toFixed(2)}s`);
  return result;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

try {
  console.log('🏗️  Starting Next.js build with performance tracking...\n');
  
  // Check environment
  const nodeEnv = process.env.NODE_ENV || 'production';
  const skipTypeCheck = process.env.SKIP_TYPE_CHECK === 'true';
  
  console.log(`📋 Build Configuration:`);
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   SKIP_TYPE_CHECK: ${skipTypeCheck}`);
  console.log(`   Node version: ${process.version}`);
  console.log(`   Memory limit: ${process.env.NODE_OPTIONS || 'default'}\n`);
  
  // Pre-build checks
  logStep('Pre-build checks', () => {
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    if (!fs.existsSync('node_modules')) {
      console.warn('⚠️  node_modules not found - run npm install first');
    }
  });
  
  // Build command - use raw next build to avoid recursion
  const buildCommand = skipTypeCheck 
    ? 'node node_modules/.bin/next build --no-lint'
    : 'node node_modules/.bin/next build';
  
  // If build:raw script exists, use it to avoid recursion
  const useRawBuild = process.env.USE_RAW_BUILD === 'true';
  const finalCommand = useRawBuild ? 'npm run build:raw' : buildCommand;
  
  logStep('Next.js build', () => {
    execSync(finalCommand, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: nodeEnv,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
        USE_RAW_BUILD: 'true', // Prevent recursion
      },
    });
  });
  
  // Post-build verification
  logStep('Post-build verification', () => {
    if (!fs.existsSync('.next')) {
      throw new Error('Build failed - .next directory not found');
    }
    
    // Count chunks
    const chunksDir = path.join('.next', 'static', 'chunks');
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
      console.log(`   📦 Generated ${chunks.length} JavaScript chunks`);
    }
    
    // Check build size
    const buildSize = getDirectorySize('.next');
    console.log(`   💾 Build size: ${formatBytes(buildSize)}`);
  });
  
  const totalDuration = Date.now() - BUILD_START;
  
  console.log('\n✅ Build completed successfully!\n');
  console.log('📊 Build Performance Summary:');
  TIMING_LOG.forEach(({ step, duration }) => {
    const percentage = ((duration / totalDuration) * 100).toFixed(1);
    console.log(`   ${step.padEnd(30)} ${formatDuration(duration).padStart(8)} (${percentage}%)`);
  });
  console.log(`\n   ${'Total build time'.padEnd(30)} ${formatDuration(totalDuration).padStart(8)}`);
  
  // Write timing log to file
  const logFile = path.join('.next', 'build-timing.json');
  fs.writeFileSync(logFile, JSON.stringify({
    totalDuration,
    steps: TIMING_LOG,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    nodeEnv,
  }, null, 2));
  console.log(`\n📝 Detailed timing log saved to: ${logFile}`);
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (err) {
    // Ignore errors
  }
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
