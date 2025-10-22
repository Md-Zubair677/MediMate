const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

// Configure AWS SNS
AWS.config.update({
  region: 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const sns = new AWS.SNS();

// Send email via Amazon SNS
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, content, appointmentId, patientName } = req.body;
    
    console.log('📧 Backend: Sending email via Amazon SNS...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    
    // SNS parameters
    const snsParams = {
      TopicArn: 'arn:aws:sns:ap-south-1:676206948283:medimate-notifications',
      Subject: subject,
      Message: content,
      MessageAttributes: {
        'email': {
          DataType: 'String',
          StringValue: to
        },
        'appointmentId': {
          DataType: 'String',
          StringValue: appointmentId
        },
        'patientName': {
          DataType: 'String',
          StringValue: patientName
        }
      }
    };

    // Send via SNS
    const result = await sns.publish(snsParams).promise();
    
    console.log('📧 ✅ Email sent via Amazon SNS!');
    console.log('📧 SNS MessageId:', result.MessageId);
    
    res.json({
      success: true,
      messageId: result.MessageId,
      message: 'Email sent via Amazon SNS',
      recipient: to
    });
    
  } catch (error) {
    console.error('❌ SNS email sending failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send email via Amazon SNS'
    });
  }
});

module.exports = router;
