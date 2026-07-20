const express = require('express');
const http = http = require('http'); // fallback or require('http')
const path = require('path');
const cors = require('cors');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require('@whiskeysockets/baileys');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const sessions = new Map();

async function createWhatsAppSession(phoneNumber, sessionId) {
    const authPath = `./auth_info_${sessionId}`;
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    let pairCode = null;
    let isConnected = false;

    if (!sock.authState.creds.registered) {
        const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
        await delay(1500);
        pairCode = await sock.requestPairingCode(cleanedNumber);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                createWhatsAppSession(phoneNumber, sessionId);
            } else {
                sessions.delete(sessionId);
            }
        } else if (connection === 'open') {
            isConnected = true;
        }
    });

    sessions.set(sessionId, { sock, getStatus: () => isConnected });
    return pairCode;
}

app.post('/api/request-pair', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        const sessionId = phone.replace(/[^0-9]/g, '');
        const code = await createWhatsAppSession(phone, sessionId);

        res.json({ success: true, pairCode: code, sessionId });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate pairing code" });
    }
});

app.post('/api/verify-code', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = sessions.get(sessionId);

        if (!session) {
            return res.json({ connected: false, message: "Session not found" });
        }

        let attempts = 0;
        while (attempts < 10) {
            if (session.getStatus()) {
                return res.json({ connected: true });
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        res.json({ connected: session.getStatus() });
    } catch (error) {
        res.status(500).json({ error: "Verification failed" });
    }
});

server.listen(PORT, () => {
    console.log(`Backend Server is running on port ${PORT}`);
});
        
