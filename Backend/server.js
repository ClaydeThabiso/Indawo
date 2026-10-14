import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import authRoutes from './routes/auth.js'
import businessApi from './routes/business.js'

const app= express();
dotenv.config();

app.use(cors({
    origin: process.env.CLIENT_URL || "https://localhost:5173",
    credentials :true
}))
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth',authRoutes)
app.use('/api/business',businessApi)
const PORT = process.env.PORT || 5000

app.listen(5000,()=>{
    console.log(`server is running on Port:${PORT}`);
})