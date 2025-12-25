const express=require('express');
const app=express();
const cors=require('cors');
const { supabase } =require('./config/SupabaseClient.js');

require('dotenv').config();

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

app.use('/api/employer',employerRoute);
app.use('/api/employee',employeeRoute);
app.use('/api/job-postings',jobPostingRoute);
app.use('/api/job-applications',jobApplicationRoute);
app.use('/api/employer-job-applications',employerJobApplnRoute);
app.use('/api/admin',adminRoute);
app.use('/api/skills',skillRoute);
app.use('/api/location',locationRoute);

app.get('/',(req,res)=>{
    res.send('Hello World!');
});

const PORT=process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
