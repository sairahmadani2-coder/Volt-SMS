const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const client = new twilio('AC67be1173eed6918046ca1f0e88e691e5', '419e855a51c6d99152565b66e887048a');
const serviceId = 'VAf5075dd523127090ddc548857d414d57';

app.post('/send-otp', async (req, res) => {
    const { number } = req.body;
    try {
        for (let i = 0; i < 10; i++) {
            await client.verify.v2.services(serviceId).verifications.create({ 
                to: number, 
                channel: 'sms' 
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
