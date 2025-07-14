#!/usr/bin/env node

/**
 * Environment Variable Debugging Script
 * 
 * Run this script with:  node scripts/check-env.js
 * 
 * This script checks for required environment variables and prints
 * debugging information to help diagnose issues.
 */

const fs = require('fs');
const path = require('path');

// Define the environment variables we need
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}Environment Variable Checker${colors.reset}\n`);

// Check for .env files
const envFiles = [
  { name: '.env.local', required: true },
  { name: '.env', required: false },
  { name: '.env.development', required: false },
  { name: '.env.production', required: false }
];

console.log(`${colors.bright}Checking for environment files:${colors.reset}`);
let envFileFound = false;

envFiles.forEach(({ name, required }) => {
  const filePath = path.join(process.cwd(), name);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}(found)${colors.reset}`);
    envFileFound = true;
  } else {
    if (required) {
      console.log(`  ${colors.red}✗${colors.reset} ${name} ${colors.dim}(missing, but required)${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}○${colors.reset} ${name} ${colors.dim}(missing, optional)${colors.reset}`);
    }
  }
});

if (!envFileFound) {
  console.log(`\n${colors.red}No environment files found. Make sure to create a .env.local file.${colors.reset}`);
}

// Check for environment variables
console.log(`\n${colors.bright}Checking for required environment variables:${colors.reset}`);
const missingVars = [];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  
  if (value) {
    console.log(`  ${colors.green}✓${colors.reset} ${envVar} ${colors.dim}(set)${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${envVar} ${colors.dim}(missing)${colors.reset}`);
    missingVars.push(envVar);
  }
});

// Summary
console.log(`\n${colors.bright}Summary:${colors.reset}`);
if (missingVars.length === 0) {
  console.log(`${colors.green}All required environment variables are set.${colors.reset}`);
} else {
  console.log(`${colors.red}Missing environment variables: ${missingVars.join(', ')}${colors.reset}`);
  console.log(`\n${colors.yellow}How to fix:${colors.reset}`);
  console.log(`1. Create or edit .env.local in your project root`);
  console.log(`2. Add the following lines (with your actual values):`);
  console.log(`\n${colors.cyan}${missingVars.map(v => `${v}=your_value_here`).join('\n')}${colors.reset}\n`);
  
  if (missingVars.includes('NEXT_PUBLIC_SUPABASE_URL') || missingVars.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log(`${colors.yellow}For Supabase:${colors.reset}`);
    console.log(`1. Go to https://supabase.com/ and sign in to your project`);
    console.log(`2. Go to Project Settings > API`);
    console.log(`3. Copy the URL and anon key from there\n`);
  }
  
  if (missingVars.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') || missingVars.includes('CLERK_SECRET_KEY')) {
    console.log(`${colors.yellow}For Clerk:${colors.reset}`);
    console.log(`1. Go to https://dashboard.clerk.com/ and select your application`);
    console.log(`2. Go to API Keys`);
    console.log(`3. Copy the publishable key and secret key from there\n`);
  }
}

process.exit(missingVars.length > 0 ? 1 : 0); 