# 🎵 Max Music School Management System

A comprehensive music education management platform built with React Native, Next.js, and Node.js.

## 🌟 Features

### For Students (Mobile App)
- 📱 Beautiful mobile interface
- 📊 View attendance and payment status
- 📅 Check batch timings
- 🎸 Practice tools (Metronome, Guitar Tuner, Chord Library)
- 🔔 Real-time notifications
- 📝 Request batch changes

### For Teachers (Web Portal)
- 🎯 Comprehensive dashboard
- ✅ One-click attendance marking
- 📋 Manage multiple batches
- 🔄 Approve/reject batch change requests
- 📈 View attendance analytics
- 👥 Student management

### Backend
- 🔐 JWT authentication with refresh tokens
- 📊 Google Sheets as database
- ⚡ Redis caching for performance
- 🔌 Real-time WebSocket updates
- 🛡️ Rate limiting and security
- 📝 Comprehensive API documentation

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Google Cloud account (for Sheets API)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/max-music-school.git
   cd max-music-school
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   npm run setup:env
   ```
   Follow the interactive wizard to configure your environment.

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run backend

   # Terminal 2: Web
   npm run web

   # Terminal 3: Mobile
   npm run mobile
   ```

## 📁 Project Structure

```
max-music-school/
├── apps/
│   ├── backend/        # Node.js API server
│   ├── web/            # Next.js web application
│   └── mobile/         # React Native mobile app
├── packages/
│   ├── shared/         # Shared types and utilities
│   └── ui/             # Shared UI components
├── scripts/            # Utility scripts
├── docs/               # Documentation
└── .github/            # GitHub workflows
```

## 🔧 Configuration

### Google Sheets Setup
1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create service account credentials
4. Share your Google Sheet with the service account email
5. Add credentials to `.env` file

### Environment Variables
```bash
# Backend (.env)
PORT=3001
JWT_SECRET=your-secret-key
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your-private-key

# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Mobile (.env)
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## 📚 Documentation

- [Setup Instructions](./docs/SETUP_INSTRUCTIONS.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Google Sheets Guide](./docs/GOOGLE_SHEETS_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Testing Guide](./docs/TESTING.md)

## 🧪 Testing

```bash
# Test backend API
npm run test:api

# Run unit tests
npm test

# Test with Docker
docker-compose up
```

## 🚢 Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or any Node.js hosting
- Ensure environment variables are set
- Enable Redis for production

### Web (Next.js)
- Deploy to Vercel (recommended)
- Or build and deploy to any hosting platform

### Mobile (React Native)
```bash
# Build for Android
cd apps/mobile
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 👥 Team

- Your Name - Project Lead
- Contributors welcome!

## 🙏 Acknowledgments

- Google Sheets API
- React Native community
- Next.js team
- All open-source contributors

## 📞 Support

- 📧 Email: support@maxmusicschool.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/max-music-school/issues)
- 📖 Docs: [Documentation](./docs/)

---

Built with ❤️ for music education
