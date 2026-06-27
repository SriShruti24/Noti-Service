const dotenv = require('dotenv');
dotenv.config();

module.exports={
    PORT:process.env.PORT,
    GMAIL_PASS:process.env.GMAIL_PASS,
    GMAIL_EMAIL:process.env.GMAIL_EMAIL,
    RABBITMQ_URL:process.env.RABBITMQ_URL
}