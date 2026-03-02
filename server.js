const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// We need the serviceAccount JSON file to list and manage Firebase users via the Admin SDK
// On local machines, we can use the json file.
// On cloud hosts (Railway, Render), we must provide the JSON content via the FIREBASE_SERVICE_ACCOUNT environment variable.
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable. Ensure it is base64 encoded.");
    }
} else {
    try {
        serviceAccount = require('./reaper-mc-store-001-firebase-adminsdk-fbsvc-cb6c444513.json');
    } catch (e) {
        console.warn("No local firebase credentials JSON found, and FIREBASE_SERVICE_ACCOUNT is not set. API will lack admin powers.");
    }
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    admin.initializeApp(); // Fallback to default, though it may fail permissions
}

const { authenticator } = require('otplib');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static frontend files from the same directory
app.use(express.static(__dirname));

// Catch JSON parsing errors so they don't leak default Express HTML
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error("Bad JSON payload received:", err.message);
        return res.status(400).json({ error: "Invalid JSON payload format." }); // Send JSON instead of HTML
    }
    next();
});

// Verify Custom JWT Middleware
const verifyToken = async (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(403).json({ error: 'Access Denied: Missing Authorization Header' });
    }

    const token = bearerHeader.split(' ')[1];
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_please_change');

        // Custom token verification (it should have admin: true)
        if (!decodedToken.admin) {
            return res.status(403).json({ error: 'Access Denied: You are not authorized.' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Access Denied: Invalid or Expired Token' });
    }
};

// Admin Login Endpoint
app.post('/api/admin/login', (req, res) => {
    try {
        const { code } = req.body;

        if (!code || code.length !== 6) {
            return res.status(400).json({ error: 'Invalid code format.' });
        }

        const secrets = process.env.ADMIN_TOTP_SECRET;
        if (!secrets) {
            return res.status(500).json({ error: 'Server misconfiguration: No TOTP secret set.' });
        }

        // Verify the TOTP code against all allowed secrets
        const secretArray = secrets.split(',').map(s => s.trim());
        let isValid = false;

        for (const secret of secretArray) {
            if (authenticator.verify({ token: code, secret: secret })) {
                isValid = true;
                break;
            }
        }

        if (isValid) {
            // Issue a Custom JWT valid for 24 hours
            const token = jwt.sign(
                { admin: true, role: 'superadmin' },
                process.env.JWT_SECRET || 'fallback_secret_please_change',
                { expiresIn: '24h' }
            );
            return res.status(200).json({ message: 'Authentication successful', token: token });
        } else {
            return res.status(401).json({ error: 'Incorrect or expired code.' });
        }
    } catch (error) {
        console.error("Login verification error:", error);
        return res.status(500).json({ error: "Internal server error during login." });
    }
});

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
