# LocalHire Setup Guide

## 🚀 Quick Start for Anyone

This app now uses **dynamic IP detection** - no need to hardcode IP addresses!

### Features
- ✅ Dynamic IP configuration (works on any network)
- ✅ SafeAreaView with react-native-safe-area-context ~5.6.0 (modern, not deprecated)
- ✅ Job offers system with scheduling conflict prevention
- ✅ Workers can choose from multiple employer offers
- ✅ Automatic double-booking prevention

### Prerequisites
- Node.js installed
- Supabase account with database setup
- Expo Go app (for testing on physical devices)

---

## 📱 Development Setup

### 1. Database Setup

**Important:** Run the job offers migration first!

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `Backend/migrations/add_job_offers.sql`
3. Paste and execute in SQL Editor
4. Verify tables created: `job_offers`, view `worker_job_offers`

See [JOB_OFFERS_SETUP.md](JOB_OFFERS_SETUP.md) for detailed information.

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create/Update `.env` file:
```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

Start the backend:
```bash
npm run dev
```

The backend will automatically display all access URLs:
```
🚀 Server is running on port 5000

📱 Access from:
   - This machine: http://localhost:5000
   - Other devices: http://192.168.x.x:5000
   - Android Emulator: http://10.0.2.2:5000

✅ Backend API ready at: http://192.168.x.x:5000/api
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start Expo:
```bash
npm start
```

**The frontend will automatically connect to your backend!**

---

## 🎯 How It Works

### Development Mode (Automatic)
- **Physical Device**: Uses the same IP as Expo Metro bundler
- **Android Emulator**: Uses `10.0.2.2` (emulator's host machine)
- **iOS Simulator**: Uses `localhost`
- **Web Browser**: Uses `localhost`

No manual configuration needed! 🎉

### Testing Options

#### Option 1: Physical Device
1. Install **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. App automatically connects to backend

#### Option 2: Android Emulator
```bash
# In Expo terminal, press 'a'
```

#### Option 3: Web Browser
```bash
# In Expo terminal, press 'w'
```

---

## 🌐 Production Deployment

### For Production Server

When deploying to production (e.g., Heroku, Railway, AWS):

1. Update `frontend/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-backend-domain.com/api"
    }
  }
}
```

2. Deploy backend to cloud service
3. Use the production URL instead of local IP

### Environment-Specific Configuration

Create different build profiles:

**app.config.js** (replaces app.json):
```javascript
export default {
  expo: {
    name: "LocalHire",
    // ... other config
    extra: {
      apiUrl: process.env.PRODUCTION_API_URL || null
    }
  }
}
```

Then build with:
```bash
# Development build (uses auto-detected IP)
expo start

# Production build (uses PRODUCTION_API_URL)
PRODUCTION_API_URL=https://api.yourapp.com/api expo build:android
```

---

## 🔧 Troubleshooting

### "Network request failed" Error

**Check:**
1. Backend is running: `npm run dev` in Backend folder
2. Both devices on same network (for physical device testing)
3. Windows Firewall allows port 5000:
   ```powershell
   netsh advfirewall firewall add rule name="LocalHire Backend" dir=in action=allow protocol=TCP localport=5000
   ```

### Wrong IP Detected

**Manual Override** (temporary):
Edit `frontend/services/api.ts` and set:
```typescript
const debuggerHost = '192.168.x.x'; // Your actual IP
```

### Firewall Blocking Connections

**Windows Firewall Rule:**
```powershell
New-NetFirewallRule -DisplayName "LocalHire API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

---

## 📦 Database Setup

### 1. Create Supabase Project
Visit [supabase.com](https://supabase.com) and create a new project

### 2. Run Migrations
In Supabase SQL Editor, run these files in order:
1. `Backend/migrations/create_messaging_tables.sql`
2. `Backend/migrations/add_job_completion.sql`
3. `Backend/migrations/add_job_scheduling.sql`

### 3. Seed Test Data (Optional)
```bash
cd Backend
node seed.js
```

This creates test accounts:
- Workers: `ravi@example.com`, `sunita@example.com`, `suresh@example.com`
- Employers: `rajesh@example.com`, `priya@example.com`, `amit@example.com`
- Password for all: `password123`

---

## 🎓 Test Accounts

After seeding, use these credentials to test:

**Worker Login:**
- Email: `ravi@example.com`
- Password: `password123`

**Employer Login:**
- Email: `rajesh@example.com`
- Password: `password123`

---

## 🤝 Sharing Your App

### For Other Developers

Share your repository and they can:
1. Clone the repo
2. Run `npm install` in both Backend and frontend
3. Create their own `.env` file with their Supabase credentials
4. Run `npm start` / `npm run dev`
5. App automatically works on their network!

### For Testers (Same Network)

1. Start both backend and frontend
2. Share the Expo QR code
3. They scan with Expo Go app
4. App connects automatically!

### For Remote Testing

Use a tunnel service:
```bash
# Option 1: Expo Tunnel
expo start --tunnel

# Option 2: ngrok
ngrok http 5000
# Update apiUrl in app.json with ngrok URL
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

---

## ✨ Features

- ✅ Dynamic IP detection (no hardcoding!)
- ✅ Works with physical devices, emulators, and web
- ✅ Production-ready configuration
- ✅ Environment variable support
- ✅ Automatic network detection

---

**Happy Coding! 🚀**
