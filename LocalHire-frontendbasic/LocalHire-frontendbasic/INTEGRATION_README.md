# LocalHire - Frontend to Backend Integration

This document explains how the frontend connects to the backend.

## Setup

### 1. Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd LocalHire-frontendbasic/LocalHire-frontendbasic
npm install
```

### 2. Configure API URL

The `services/api.ts` automatically selects the correct URL based on your platform:

- **Android Emulator**: Uses `http://10.0.2.2:5000/api` (automatically)
- **iOS Simulator**: Uses `http://localhost:5000/api` (automatically)  
- **Physical Device**: Uses `http://192.168.1.124:5000/api` (update IP in api.ts if needed)

To update for your network, edit the production URL in `services/api.ts`:

```typescript
// For physical devices or production, update this IP to your machine's IP
return 'http://YOUR_IP_ADDRESS:5000/api';
```

### 3. Start the Backend

```bash
cd Backend
npm install
npm run dev  # or: npm start
```

The backend will run on port 5000. Make sure your `.env` file has:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service key
- `JWT_SECRET` - A secret key for JWT tokens

### 4. Start the Frontend

```bash
cd LocalHire-frontendbasic/LocalHire-frontendbasic
npx expo start
```

Press `a` for Android or `i` for iOS.

## API Integration Overview

### Services

| Service | File | Purpose |
|---------|------|---------|
| API Config | `services/api.ts` | Base URL configuration & request helper |
| Auth Service | `services/authService.ts` | Login, Register, Logout, Token management |
| Profile Service | `services/profileService.ts` | Get/Update employee/employer profiles |
| Job Service | `services/jobService.ts` | Create, Read, Update, Delete job postings |
| Application Service | `services/applicationService.ts` | Workers apply/withdraw from jobs |
| Employer App Service | `services/employerApplicationService.ts` | Employers view/manage applications |
| Skill Service | `services/skillService.ts` | Get available skills |
| Location Service | `services/locationService.ts` | Find nearby jobs/employees by location |

### Auth Context

The `context/AuthContext.tsx` provides global authentication state:

```typescript
import { useAuth } from '../context/AuthContext';

const { user, userType, isAuthenticated, login, register, logout, refreshProfile } = useAuth();
```

### Connected Screens

| Screen | Backend Connection |
|--------|-------------------|
| Login | ✅ Employee/Employer login via API |
| Register | ✅ Employee/Employer registration via API |
| Worker Home | ✅ Fetches nearby jobs via location API |
| Worker Search | ✅ Search jobs by location |
| Worker Profile | ✅ Fetches profile from API |
| Worker Job Details | ✅ View job details & apply via API |
| Worker Settings | ✅ Logout clears auth token |
| Employer Dashboard | ✅ Fetches employer's jobs |
| Employer Post Job | ✅ Creates job via API |
| Employer Jobs | ✅ Fetches/updates/deletes jobs |
| Employer Candidates | ✅ View/manage applications |
| Employer Settings | ✅ Logout clears auth token |

## Authentication Flow

1. User registers → API creates user → Token stored in AsyncStorage
2. User logs in → API validates credentials → Token stored in AsyncStorage  
3. All API calls include token in `Authorization: Bearer <token>` header
4. User logs out → Token removed from AsyncStorage → Redirect to home

## Backend API Endpoints

### Employee (Worker)
- `POST /api/employee/register` - Register new employee
- `POST /api/employee/login` - Login employee
- `GET /api/employee/profile` - Get employee profile (auth required)
- `PUT /api/employee/update` - Update employee profile (auth required)
- `POST /api/employee/skills` - Add skill to employee (auth required)
- `DELETE /api/employee/skills/:skill_id` - Remove skill (auth required)

### Employer
- `POST /api/employer/register` - Register new employer
- `POST /api/employer/login` - Login employer
- `GET /api/employer/profile` - Get employer profile (auth required)
- `PUT /api/employer/update` - Update employer profile (auth required)

### Job Postings
- `GET /api/job-postings/myjobs` - Get employer's jobs (auth required)
- `POST /api/job-postings/create` - Create new job (auth required)
- `GET /api/job-postings/:id` - Get job by ID (auth required)
- `PUT /api/job-postings/update/:id` - Update job (auth required)
- `DELETE /api/job-postings/delete/:id` - Delete job (auth required)
- `POST /api/job-postings/:id/skills` - Add skill to job (auth required)
- `DELETE /api/job-postings/:id/skills` - Remove skill from job (auth required)

### Job Applications (Worker)
- `POST /api/job-applications/apply` - Apply for a job (auth required)
- `GET /api/job-applications/my-applications` - Get worker's applications (auth required)
- `GET /api/job-applications/application/:id` - Get application details (auth required)
- `DELETE /api/job-applications/withdraw/:application_id` - Withdraw application (auth required)

### Employer Job Applications
- `GET /api/employer-job-applications/:job_id/applications` - Get applications for a job (auth required)
- `PUT /api/employer-job-applications/applications/:application_id/status` - Update application status (auth required)

### Skills
- `GET /api/skills/skills` - Get all available skills (public)

### Location
- `GET /api/location/jobs?latitude=X&longitude=Y&radius_km=Z` - Find nearby jobs
- `GET /api/location/employees?latitude=X&longitude=Y&radius_km=Z` - Find nearby employees

## Troubleshooting

### Common Issues

1. **"Network request failed"**
   - Ensure backend is running
   - Check if IP address is correct in `api.ts`
   - For Android emulator, make sure you're using `10.0.2.2` not `localhost`

2. **"Unauthorized" errors**
   - Token may have expired (7 days validity)
   - Try logging out and logging in again

3. **CORS errors (web)**
   - Backend has CORS enabled for all origins by default

4. **"Invalid credentials"**
   - Check email/password are correct
   - Make sure you're selecting the right user type (Worker/Employer)

## Notes

- The frontend uses email for login (matching backend requirements)
- Token is persisted across app restarts using AsyncStorage
- JWT tokens expire after 7 days
- API URL is automatically selected based on platform in development mode
