import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
  
        const user = await pool.query(
            'SELECT id, first_name, last_name, email, role, points FROM users WHERE id = $1',
            [decoded.id]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Not authorized, user not found.' });
        }

        // Attach safe user data to the request
        req.user = user.rows[0];
        
        next();

    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        res.status(401).json({ message: "Not authorized, token failed." });
    }
};