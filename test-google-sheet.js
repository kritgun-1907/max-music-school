#!/usr/bin/env node
// test-google-sheets.js - Test Google Sheets Connection

require('dotenv').config({ path: './apps/backend/.env' });
const { google } = require('googleapis');

console.log('🔍 Testing Google Sheets Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('✓ GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Set' : '❌ Missing');
console.log('✓ GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('✓ GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set (length: ' + process.env.GOOGLE_PRIVATE_KEY.length + ')' : '❌ Missing');
console.log('');

if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
  console.log('❌ Missing required environment variables!');
  console.log('Please check your .env file in apps/backend/');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔐 Creating auth client...');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    console.log('✅ Auth client created\n');

    console.log('📊 Connecting to Google Sheets...');
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('✅ Sheets client created\n');

    console.log('📖 Reading sheet data...');
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Test reading metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId
    });

    console.log('✅ Successfully connected to sheet!');
    console.log('   Sheet title:', metadata.data.properties.title);
    console.log('   Available sheets:');
    metadata.data.sheets.forEach(sheet => {
      console.log('   -', sheet.properties.title);
    });
    console.log('');

    // Try to read Teachers sheet
    console.log('📖 Reading Teachers sheet...');
    try {
      const teachersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Teachers!A:F'
      });

      const rows = teachersResponse.data.values || [];
      console.log('✅ Teachers sheet found!');
      console.log('   Total rows:', rows.length);
      if (rows.length > 0) {
        console.log('   Headers:', rows[0]);
        console.log('   Data rows:', rows.length - 1);
        if (rows.length > 1) {
          console.log('   Sample teacher:', {
            name: rows[1][0],
            email: rows[1][2],
            status: rows[1][5]
          });
        }
      }
      console.log('');
    } catch (error) {
      console.log('❌ Error reading Teachers sheet:', error.message);
      console.log('');
    }

    // Try to read Students sheet
    console.log('📖 Reading Students sheet...');
    try {
      const studentsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Students!A:X'
      });

      const rows = studentsResponse.data.values || [];
      console.log('✅ Students sheet found!');
      console.log('   Total rows:', rows.length);
      if (rows.length > 0) {
        console.log('   Headers:', rows[0]);
        console.log('   Data rows:', rows.length - 1);
        if (rows.length > 1) {
          console.log('   Sample student:', {
            name: rows[1][1],
            email: rows[1][3],
            status: rows[1][16]
          });
        }
      }
      console.log('');
    } catch (error) {
      console.log('❌ Error reading Students sheet:', error.message);
      console.log('');
    }

    console.log('🎉 Connection test complete!\n');
    console.log('If you see errors above, check:');
    console.log('1. Sheet is shared with service account email');
    console.log('2. Sheet has tabs named "Students" and "Teachers"');
    console.log('3. Service account has Editor permission');

  } catch (error) {
    console.log('❌ Connection test failed!');
    console.log('Error:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('1. Sheet not shared with:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('2. Invalid GOOGLE_PRIVATE_KEY (check line breaks are \\n)');
    console.log('3. Google Sheets API not enabled in Cloud Console');
    console.log('4. Wrong GOOGLE_SHEET_ID');
    process.exit(1);
  }
}

testConnection();