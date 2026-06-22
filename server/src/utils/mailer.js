const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (!transporter && env.mail.host && env.mail.user) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: {
        user: env.mail.user,
        pass: env.mail.pass,
      },
    });
  }
  return transporter;
};

/**
 * Send contact form notification email to the team.
 */
const sendContactNotification = async (submission) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn('⚠ Mail not configured — skipping notification email');
    return;
  }

  const html = `
    <h2>New Contact Submission</h2>
    <p><strong>Name:</strong> ${submission.firstName} ${submission.lastName}</p>
    <p><strong>Email:</strong> ${submission.email}</p>
    ${submission.phone ? `<p><strong>Phone:</strong> ${submission.phone}</p>` : ''}
    ${submission.companyName ? `<p><strong>Company:</strong> ${submission.companyName}</p>` : ''}
    ${submission.projectType ? `<p><strong>Project Type:</strong> ${submission.projectType}</p>` : ''}
    ${submission.budgetRange ? `<p><strong>Budget Range:</strong> ${submission.budgetRange}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${submission.message || 'No message provided'}</p>
    <hr />
    <p><em>Source: ${submission.source}</em></p>
  `;

  await transport.sendMail({
    from: env.mail.from,
    to: env.mail.notificationEmail,
    subject: `New Lead: ${submission.firstName} ${submission.lastName} — ${submission.projectType || 'General Inquiry'}`,
    html,
  });
};

module.exports = { sendContactNotification };
