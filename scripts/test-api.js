#!/usr/bin/env node
// scripts/test-api.js - Complete API Testing Script

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3001;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test credentials (update these with your actual test data)
const TEST_STUDENT = {
  email: 'varindermax@gmail.com',
  password: '1212'
};

const TEST_TEACHER = {
  email: 'varindermax@gmail.com',
  password: '1234'
};

let studentToken = '';
let teacherToken = '';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.cyan}ðŸ“‹ Test 1: Health Check${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  try {
    const result = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/health',
      method: 'GET'
    });
    
    if (result.status === 200) {
      console.log(`${colors.green}âœ… Health check passed${colors.reset}`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Uptime: ${Math.floor(result.data.uptime)}s`);
      return true;
    } else {
      console.log(`${colors.red}âŒ Health check failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}âŒ Error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}   Make sure the server is running on ${API_HOST}:${API_PORT}${colors.reset}`);
    return false;
  }
}

async function testStudentLogin() {
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.cyan}ðŸ“‹ Test 2: Student Login${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  try {
    const result = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/student/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, TEST_STUDENT);
    
    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}âœ… Student login successful${colors.reset}`);
      console.log(`   User: ${result.data.user.name}`);
      console.log(`   Email: ${result.data.user.email}`);
      console.log(`   Token: ${result.data.accessToken.substring(0, 20)}...`);
      studentToken = result.data.accessToken;
      return true;
    } else {
      console.log(`${colors.red}âŒ Student login failed${colors.reset}`);
      console.log(`   Response: ${JSON.stringify(result.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}âŒ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testTeacherLogin() {
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.cyan}ðŸ“‹ Test 3: Teacher Login${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  try {
    const result = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/teacher/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, TEST_TEACHER);
    
    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}âœ… Teacher login successful${colors.reset}`);
      console.log(`   User: ${result.data.user.name}`);
      console.log(`   Email: ${result.data.user.email}`);
      console.log(`   Token: ${result.data.accessToken.substring(0, 20)}...`);
      teacherToken = result.data.accessToken;
      return true;
    } else {
      console.log(`${colors.red}âŒ Teacher login failed${colors.reset}`);
      console.log(`   Response: ${JSON.stringify(result.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}âŒ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testStudentDashboard() {
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.cyan}ðŸ“‹ Test 4: Student Dashboard${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  if (!studentToken) {
    console.log(`${colors.red}âŒ Skipped: No student token available${colors.reset}`);
    return false;
  }
  
  try {
    const result = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/student/dashboard',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (result.status === 200) {
      console.log(`${colors.green}âœ… Student dashboard fetched${colors.reset}`);
      console.log(`   Name: ${result.data.profile?.name || 'N/A'}`);
      console.log(`   Attendance: ${result.data.attendance?.percentage || 0}%`);
      console.log(`   Status: ${result.data.profile?.status || 'N/A'}`);
      return true;
    } else {
      console.log(`${colors.red}âŒ Dashboard fetch failed${colors.reset}`);
      console.log(`   Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}âŒ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testTeacherBatches() {
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.cyan}ðŸ“‹ Test 5: Teacher Batches${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  if (!teacherToken) {
    console.log(`${colors.red}âŒ Skipped: No teacher token available${colors.reset}`);
    return false;
  }
  
  try {
    const result = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/teacher/batches',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (result.status === 200) {
      console.log(`${colors.green}âœ… Teacher batches fetched${colors.reset}`);
      console.log(`   Total batches: ${result.data.length || 0}`);
      if (result.data.length > 0) {
        console.log(`   First batch: ${result.data[0].batchName}`);
        console.log(`   Students: ${result.data[0].students?.length || 0}`);
      }
      return true;
    } else {
      console.log(`${colors.red}âŒ Batches fetch failed${colors.reset}`);
      console.log(`   Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}âŒ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testStudentProfile() {
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.cyan}ðŸ“‹ Test 6: Student Profile${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  if (!studentToken) {
    console.log(`${colors.red}âŒ Skipped: No student token available${colors.reset}`);
    return false;
  }
  
  try {
    const result = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/student/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (result.status === 200) {
      console.log(`${colors.green}âœ… Student profile fetched${colors.reset}`);
      console.log(`   Name: ${result.data.name || 'N/A'}`);
      console.log(`   Batch: ${result.data.batchName || 'N/A'}`);
      console.log(`   Teacher: ${result.data.teacher || 'N/A'}`);
      return true;
    } else {
      console.log(`${colors.red}âŒ Profile fetch failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}âŒ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.blue}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}â•‘   Max Music School API Test Suite     â•‘${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${colors.reset}`);
  console.log(`\n${colors.yellow}Testing API at: ${API_HOST}:${API_PORT}${colors.reset}\n`);
  
  const results = [];
  
  // Run all tests
  results.push(await testHealthCheck());
  results.push(await testStudentLogin());
  results.push(await testTeacherLogin());
  results.push(await testStudentDashboard());
  results.push(await testTeacherBatches());
  results.push(await testStudentProfile());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}âœ… All tests passed! (${passed}/${total})${colors.reset}`);
  } else {
    console.log(`${colors.yellow}âš ï¸  Some tests failed: ${passed}/${total} passed${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}\n`);
  
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
