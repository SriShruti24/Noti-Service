const nodemailer=require('nodemailer');

const {GMAIL_EMAIL,GMAIL_PASS}=require('./server-config');
const mailsender=nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth:{
        user:GMAIL_EMAIL,
        pass:GMAIL_PASS
    }
});
module.exports=mailsender;