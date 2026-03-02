const { authenticator } = require('otplib');
const qrcode = require('qrcode-terminal');

// Generate a random secret
const secret = authenticator.generateSecret();
console.log('\n=============================================');
console.log('YOUR NEW GOOGLE AUTHENTICATOR SECRET:');
console.log('\x1b[32m%s\x1b[0m', secret);
console.log('=============================================\n');
console.log('IMPORTANT: Add this line to your .env file:');
console.log(`ADMIN_TOTP_SECRET=${secret}\n`);

// Create a URI for the Google Authenticator app
const user = 'admin@reapermc.net'; // You can change this label
const service = 'Reaper MC Admin'; // The app name shown in Authenticator
const otpauth = authenticator.keyuri(user, service, secret);

// Generate and display the QR code in the terminal
console.log('Scan this QR code with the Google Authenticator app on your phone:\n');
qrcode.generate(otpauth, { small: true });
console.log('\nOnce scanned, you should see a 6-digit code that changes every 30 seconds.');
console.log('Delete this script after you have saved your secret in .env.');
