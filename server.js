const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Firebase Admin with the downloaded service account key
const serviceAccount = require('./reaper-mc-store-001-firebase-adminsdk-fbsvc-787a8454c0.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// Verify Firebase JWT Middleware
const verifyToken = async (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(403).json({ error: 'Access Denied: Missing Authorization Header' });
    }

    const token = bearerHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check if the authenticated user's email is in the allowed Admin Emails list
        const allowedEmails = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim()) : [];
        if (!allowedEmails.includes(decodedToken.email)) {
            return res.status(403).json({ error: 'Access Denied: You are not authorized to view the admin panel.' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Access Denied: Invalid or Expired Token' });
    }
};

// List all users
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users.map(userRecord => userRecord.toJSON());
        res.status(200).json(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Disable/Enable a user
app.post('/api/users/:uid/status', verifyToken, async (req, res) => {
    const { uid } = req.params;
    const { disabled } = req.body; // true to disable, false to enable
    try {
        await admin.auth().updateUser(uid, { disabled });
        res.status(200).json({ message: `User status updated to ${disabled ? 'disabled' : 'enabled'}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a user
app.delete('/api/users/:uid', verifyToken, async (req, res) => {
    const { uid } = req.params;
    try {
        await admin.auth().deleteUser(uid);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update password
app.post('/api/users/:uid/password', verifyToken, async (req, res) => {
    const { uid } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    try {
        await admin.auth().updateUser(uid, { password });
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Minecraft username (displayName)
app.post('/api/users/:uid/username', verifyToken, async (req, res) => {
    const { uid } = req.params;
    const { username } = req.body;
    try {
        await admin.auth().updateUser(uid, { displayName: username });
        res.status(200).json({ message: 'Username updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Admin Server listening on port ${PORT}`);
});
