const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const accountSid = 'AC67be1173eed6918046ca1f0e88e691e5';
const authToken = '419e855a51c6d99152565b66e887048a';
const client = twilio(accountSid, authToken);

app.post('/send-otp', async (req, res) => {
    const { number } = req.body;
    try {
        const verification = await client.verify.v2.services('VAf5075dd523127090ddc548857d414d57')
            .verifications.create({ to: number, channel: 'sms' });
        res.json({ success: true, message: 'OTP sent!', sid: verification.sid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Volt-SMS API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
