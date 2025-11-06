# 🚀 QUICK INSTALLATION GUIDE

## 1. System Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0
- Google Cloud account
- (Optional) Redis for caching

## 2. Install Dependencies
```bash
cd max-music-school-complete
npm install
```

## 3. Setup Environment Variables

### Backend (.env)
```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env`:
```env
PORT=3001
JWT_SECRET=change-this-secret-key
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----"
```

### Web (.env.local)
```bash
cd apps/web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Mobile (.env)
```bash
cd apps/mobile
cp .env.example .env
```

Edit `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## 4. Start Applications

Open 3 terminals:

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Web:**
```bash
npm run web
```

**Terminal 3 - Mobile:**
```bash
npm run mobile
```

## 5. Test Everything

```bash
# Test backend API
node scripts/test-api.js

# Access web app
# Open http://localhost:3000

# Access mobile app
# Scan QR code with Expo Go app
```

## 6. Done! 🎉

Your Max Music School system is now running!

### Default URLs:
- Backend API: http://localhost:3001
- Web Portal: http://localhost:3000
- Mobile App: Expo Dev Server

### Test Credentials:
Check your Google Sheet for student credentials or use:
- Email: (from your Google Sheet)
- Password: (from your Google Sheet)

---

Need help? Check PROJECT_PACKAGE_README.md for detailed instructions.
