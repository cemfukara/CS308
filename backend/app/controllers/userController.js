// This file contains business logic for user-related operations (login, register, etc.).

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';

// hardcoded users array for test
//const users = [];

// LOGIN Controller
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // fetch user by email
        const [rows] = await db.query(
            'SELECT id, email, password, role FROM users WHERE email = ?',
            [email]
        );
        if (!rows || rows.length === 0) {
            return res
                .status(401)
                .json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        // compare hashed password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res
                .status(401)
                .json({ message: 'Invalid email or password.' });
        }

        // create token payload
        const payload = { id: user.id, role: user.role };

        // sign JWT
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.cookie('token', token, {
            httpOnly: true, // cannot be accessed via JS
            secure: process.env.NODE_ENV === 'production', // only true in production
            sameSite: 'strict', // prevents CSRF
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.status(200).json({ message: 'Login successful as' });

        // these lines are for testing controller with hardcoded users array
        /*         const user = users.find((u) => u.email === email);
        if (!user)
            return res.status(401).json({ message: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        }); 
        res.status(200).json({ message: 'Login successful' ,token});*/
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// REGISTER controller
export const register = async (req, res) => {
    const { email, password } = req.body; //get body
    const role = 'user';
    try {
        const [existing] = await db.query(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );
        if (existing.length > 0)
            return res
                .status(409)
                .json({ message: 'Email already registered' }); // 409 = Conflict

        const id = uuidv4(); // unique user id
        const hashed = await bcrypt.hash(password, 10); // hash the pw

        await db.query(
            'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
            [id, email, hashed, role]
        ); // insert into db

        res.status(201).json({ message: 'User registered successfully' });

        // these lines are for testing controller with hardcoded users array
        /*         if (users.find((u) => u.email === email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            email,
            password: hashed,
            role: role || 'customer',
        };
        users.push(newUser);

        res.status(201).json({
            message: 'User registered',
            user: { id: newUser.id, email, role: newUser.role },
        }); */
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
