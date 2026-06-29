const express = require('express');
const http = require('http');
const https = require('https');
const amqplib = require('amqplib');
const { ServerConfig } = require('./config');
const { EmailService } = require('./services');
const apiRoutes = require('./routes');

async function connectQueue() {
    try {
        const connection = await amqplib.connect(ServerConfig.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue("noti-queue");
        channel.consume("noti-queue", async (data) => {
            let ticketId = null;
            let object = {};
            try {
                console.log(`Received queue message: ${Buffer.from(data.content)}`);
                object = JSON.parse(`${Buffer.from(data.content)}`);

                // Create database ticket record
                const ticket = await EmailService.createTicket({
                    subject: object.subject,
                    content: object.text,
                    recepientEmail: object.recepientEmail,
                    status: 'PENDING'
                });
                ticketId = ticket.id;

                // Send email
                const senderEmail = ServerConfig.GMAIL_EMAIL || "airlinenoti2@gmail.com";
                await EmailService.sendEmail(senderEmail, object.recepientEmail, object.subject, object.text);

                // Update ticket status to SUCCESS
                if (ticketId) {
                    await EmailService.updateTicket(ticketId, { status: 'SUCCESS' });
                }
                channel.ack(data);
                console.log(`Successfully processed email notification for ticket ${ticketId}`);
            } catch (err) {
                console.error("Queue consumption error:", err.message);
                if (ticketId) {
                    await EmailService.updateTicket(ticketId, { status: 'FAILED' }).catch(() => {});
                }
                // Always ack to prevent poison message loop
                channel.ack(data);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

// Health check — used by Render and self-ping to keep service alive
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(ServerConfig.PORT, async () => {
    console.log(`Server is running on port: ${ServerConfig.PORT}`);
    await connectQueue();
    console.log("queue is up");

    // Self-ping every 10 minutes to prevent Render free-tier cold starts.
    // Without this the service sleeps after 15 min of inactivity and queue
    // messages pile up — causing emails to arrive 40+ minutes late.
    const SERVICE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${ServerConfig.PORT}`;
    setInterval(() => {
        const client = SERVICE_URL.startsWith('https') ? https : http;
        client.get(`${SERVICE_URL}/ping`, (res) => {
            console.log(`[self-ping] ${res.statusCode}`);
        }).on('error', (err) => {
            console.warn('[self-ping] failed:', err.message);
        });
    }, 10 * 60 * 1000); // every 10 minutes
});