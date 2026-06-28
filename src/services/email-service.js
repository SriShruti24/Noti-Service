const {TicketRepository}=require('../repositories');
const {MAILER}=require('../config');
const ticketRepo=new TicketRepository();

async function sendEmail(mailFrom,mailTo,subject,text){
try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
        console.log('Sending email via Brevo HTTP API...');
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': brevoApiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'Booking Mafia',
                    email: mailFrom
                },
                to: [
                    {
                        email: mailTo
                    }
                ],
                subject: subject,
                textContent: text
            })
        });
        
        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Brevo HTTP API failed with status ${response.status}: ${errBody}`);
        }
        
        const data = await response.json();
        console.log('Email sent successfully via Brevo HTTP API:', data.messageId);
        return data;
    } else {
        console.log('Sending email via standard Nodemailer SMTP...');
        const response = await MAILER.sendMail({
            from:mailFrom,
            to:mailTo,
            subject:subject,
            text:text
        });
        return response;
    }
} catch (error) {
    console.log(error);
    throw error;
}
}

async function createTicket(data){
    try {
        const response=await ticketRepo.create(data);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getpendingEmails(){
   try {
    const response=await ticketRepo.getPendingTickets();
    return response;
   } catch (error) {
            console.log(error);
        throw error;
   } 
}


async function updateTicket(ticketId, data){
    try {
        const response=await ticketRepo.update(ticketId, data);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports={
sendEmail,
createTicket,
updateTicket,
getpendingEmails
}