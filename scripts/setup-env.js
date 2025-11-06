#!/usr/bin/env node
// scripts/setup-env.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║   Max Music School Environment Setup          ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.cyan}This wizard will help you set up your environment variables.${colors.reset}\n`);

  // Collect configuration
  console.log(`${colors.yellow}📋 Google Sheets Configuration${colors.reset}`);
  const spreadsheetId = await question('Google Sheet ID (from the URL): ');
  const serviceAccountEmail = await question('Service Account Email: ');
  
  console.log(`\n${colors.yellow}⚠️  For the private key, paste the entire key including headers${colors.reset}`);
  console.log(`${colors.yellow}   (-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----)${colors.reset}`);
  const privateKey = await question('Private Key (paste and press Enter): ');

  console.log(`\n${colors.yellow}🔐 JWT Configuration${colors.reset}`);
  console.log(`${colors.cyan}Generating secure random secrets...${colors.reset}`);
  const crypto = require('crypto');
  const accessSecret = crypto.randomBytes(32).toString('base64');
  const refreshSecret = crypto.randomBytes(32).toString('base64');

  console.log(`\n${colors.yellow}🌐 Server Configuration${colors.reset}`);
  const port = await question('Backend Port (default: 3001): ') || '3001';
  const corsOrigins = await question('CORS Origins (comma-separated, default: http://localhost:3000,http://localhost:19006): ') || 'http://localhost:3000,http://localhost:19006';

  console.log(`\n${colors.yellow}📦 Redis Configuration${colors.reset}`);
  const redisUrl = await question('Redis URL (default: redis://localhost:6379): ') || 'redis://localhost:6379';

  // Create .env file content
  const envContent = `# Max Music School Environment Configuration
# Generated on ${new Date().toISOString()}

# ==================== Google Sheets Configuration ====================
GOOGLE_SHEET_ID=${spreadsheetId}
GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccountEmail}
GOOGLE_PRIVATE_KEY="${privateKey}"

# ==================== Server Configuration ====================
PORT=${port}
NODE_ENV=development

# ==================== JWT Secrets ====================
JWT_ACCESS_SECRET=${accessSecret}
JWT_REFRESH_SECRET=${refreshSecret}

# ==================== Redis Configuration ====================
REDIS_URL=${redisUrl}

# ==================== CORS Configuration ====================
CORS_ALLOWED_ORIGINS=${corsOrigins}

# ==================== Rate Limiting ====================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ==================== Session Configuration ====================
SESSION_SECRET=${crypto.randomBytes(32).toString('base64')}
`;

  // Write to .env file in backend directory
  const backendEnvPath = path.join(__dirname, '../apps/backend/.env');
  const rootEnvPath = path.join(__dirname, '../.env');

  // Ensure directory exists
  const backendDir = path.dirname(backendEnvPath);
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }

  fs.writeFileSync(backendEnvPath, envContent);
  fs.writeFileSync(rootEnvPath, envContent);

  console.log(`\n${colors.green}✅ Environment configuration created successfully!${colors.reset}`);
  console.log(`📁 Backend: ${backendEnvPath}`);
  console.log(`📁 Root: ${rootEnvPath}`);
  
  console.log(`\n${colors.yellow}⚠️  Important Next Steps:${colors.reset}`);
  console.log(`${colors.cyan}1.${colors.reset} Share your Google Sheet with: ${serviceAccountEmail}`);
  console.log(`${colors.cyan}2.${colors.reset} Enable Google Sheets API in Google Cloud Console`);
  console.log(`${colors.cyan}3.${colors.reset} Install Redis: ${colors.bright}brew install redis${colors.reset} (Mac) or ${colors.bright}apt-get install redis${colors.reset} (Linux)`);
  console.log(`${colors.cyan}4.${colors.reset} Start Redis: ${colors.bright}redis-server${colors.reset}`);
  console.log(`${colors.cyan}5.${colors.reset} Install dependencies: ${colors.bright}npm install${colors.reset}`);
  console.log(`${colors.cyan}6.${colors.reset} Start backend: ${colors.bright}npm run backend${colors.reset}`);
  console.log(`${colors.cyan}7.${colors.reset} Test API: ${colors.bright}npm run test:api${colors.reset}`);
  
  console.log(`\n${colors.blue}📚 Documentation:${colors.reset}`);
  console.log(`- Google Sheets API: https://developers.google.com/sheets/api/quickstart/nodejs`);
  console.log(`- Service Accounts: https://cloud.google.com/iam/docs/service-accounts-create`);
  console.log(`- Redis Setup: https://redis.io/docs/getting-started/`);
  
  console.log(`\n${colors.green}🎉 Setup complete! You're ready to start development.${colors.reset}\n`);
  
  rl.close();
}

setupEnvironment().catch(error => {
  console.error(`${colors.red}❌ Setup failed: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});
