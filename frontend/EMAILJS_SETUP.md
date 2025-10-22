# EmailJS Setup Guide for Real Email Sending

## 1. Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## 2. Create Email Service
1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. Copy your **Service ID**

## 3. Create Email Template
1. Go to **Email Templates** in your dashboard
2. Click **Create New Template**
3. Use this template content:

```html
Subject: Appointment Confirmation - {{appointment_id}}

Dear {{to_name}},

Your appointment has been successfully booked:

Appointment Details:
- ID: {{appointment_id}}
- Date: {{appointment_date}}
- Time: {{appointment_time}}
- Hospital: {{hospital}}
- Meeting Type: {{meeting_type}}
- Doctor: {{doctor_name}}

Patient Information:
- Name: {{patient_name}}
- Age: {{patient_age}}
- Phone: {{patient_phone}}
- Email: {{patient_email}}

Symptoms: {{symptoms}}

{{#meeting_link}}
Video Meeting Link: {{meeting_link}}
{{/meeting_link}}

{{#location_details}}
Location Details:
{{location_details}}
{{/location_details}}

Thank you for choosing MediMate!

Best regards,
MediMate Healthcare Team
```

4. Save and copy your **Template ID**

## 4. Get Public Key
1. Go to **Account** → **General**
2. Copy your **Public Key**

## 5. Update Code
Replace these values in `ChatPage.js`:

```javascript
emailjs.init("YOUR_PUBLIC_KEY");        // Your Public Key
'YOUR_SERVICE_ID',                      // Your Service ID  
'YOUR_TEMPLATE_ID',                     // Your Template ID
```

## 6. Test Email Sending
1. Book an appointment through the app
2. Check the recipient's email inbox
3. Verify email content and formatting

## Free Tier Limits
- 200 emails per month
- EmailJS branding in emails
- Basic support

## Upgrade for Production
- Remove EmailJS branding
- Higher email limits
- Priority support
- Custom domains

## Alternative: Backend Email Service
For production apps, consider:
- **Node.js + Nodemailer**
- **SendGrid API**
- **AWS SES**
- **Mailgun**

These provide better security and higher limits.
