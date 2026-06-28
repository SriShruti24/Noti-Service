const express=require('express');
const amqplib =require("amqplib");
const {EmailService}=require('./services')
async function connectQueue(){
    try {
        const connection =await amqplib.connect(ServerConfig.RABBITMQ_URL);
        const channel =await connection.createChannel();
        await channel.assertQueue("noti-queue");
        channel.consume("noti-queue",async(data)=>{
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
        })
    } catch (error) {
       console.log(error) ;
    }
}
const {ServerConfig}=require('./config');
const apiRoutes=require('./routes');

const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api',apiRoutes);


app.listen(ServerConfig.PORT,async()=>{
    console.log(`Server is running on port: ${ServerConfig.PORT}`);
    await connectQueue();
    console.log("queue is up");
});