const express = require('express');
const {InfoController,EmailController}= require('../../controllers');

const router = express.Router();

router.get('/info',InfoController.info);
router.post('/tickets',EmailController.create);
router.get('/smtp-test', async (req, res) => {
  try {
    const mailsender = require('../../config/email-config');
    await mailsender.verify();
    return res.status(200).json({ success: true, message: 'SMTP connection verified successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports=router;