const express=require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app=express();
const cors=require('cors');
const { supabase } =require('./config/SupabaseClient.js');

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

const employeeRoute=require('./Routers/WorkerRoute.js');
const employerRoute=require('./Routers/EmployerRoute.js');
const jobPostingRoute=require('./Routers/JobPostingRoute.js');
const jobApplicationRoute=require('./Routers/JobApplicationRoute.js');
const employerJobApplnRoute=require('./Routers/EmployerJobApplnRoute.js');
const adminRoute=require('./Routers/AdminRoute.js');
const skillRoute=require('./Routers/SkillRoute.js');
const locationRoute=require('./Routers/LocationRoute.js');
const notificationRoute=require('./Routers/NotificationRoute.js');
const messageRoute=require('./Routers/MessageRoute.js');
const analyticsRoute=require('./Routers/AnalyticsRoute.js');
const jobOfferRoute=require('./Routers/JobOfferRoute.js');

app.use('/api/employer',employerRoute);
app.use('/api/employee',employeeRoute);
app.use('/api/job-postings',jobPostingRoute);
app.use('/api/job-applications',jobApplicationRoute);
app.use('/api/employer-job-applications',employerJobApplnRoute);
app.use('/api/admin',adminRoute);
app.use('/api/skills',skillRoute);
app.use('/api/location',locationRoute);
app.use('/api/notifications',notificationRoute);
app.use('/api/messages',messageRoute);
app.use('/api/analytics',analyticsRoute);
app.use('/api/job-offers',jobOfferRoute);

app.get('/',(req,res)=>{
    res.send('Hello World!');
});

const PORT=process.env.PORT || 5000;
const os = require('os');

// Get local network IP address dynamically
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
};

app.listen(PORT, '0.0.0.0', ()=>{
    const localIP = getLocalIP();
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`\n📱 Access from:`);
    console.log(`   - This machine: http://localhost:${PORT}`);
    console.log(`   - Other devices: http://${localIP}:${PORT}`);
    console.log(`   - Android Emulator: http://10.0.2.2:${PORT}`);
    console.log(`\n✅ Backend API ready at: http://${localIP}:${PORT}/api\n`);
});
