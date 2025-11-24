import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service is ready');
  }
});

// Send email to admin when student submits a concern
export const sendConcernSubmissionEmail = async (concern, student) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Concern Submitted - ${concern.ticketId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .concern-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .label { font-weight: bold; color: #667eea; }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .severity-high { background: #fee; color: #c00; }
            .severity-medium { background: #ffeaa7; color: #d63031; }
            .severity-low { background: #dfe6e9; color: #2d3436; }
            .severity-critical { background: #d63031; color: white; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 Brototype - New Concern Submitted</h2>
            </div>
            <div class="content">
              <p>Hello Admin,</p>
              <p>A new concern has been submitted by a student. Please review and take appropriate action.</p>
              
              <div class="concern-details">
                <p><span class="label">Ticket ID:</span> ${concern.ticketId}</p>
                <p><span class="label">Student:</span> ${concern.isAnonymous ? 'Anonymous' : student.name}</p>
                ${!concern.isAnonymous ? `<p><span class="label">Email:</span> ${student.email}</p>` : ''}
                ${!concern.isAnonymous && student.campus ? `<p><span class="label">Campus:</span> ${student.campus}</p>` : ''}
                <p><span class="label">Category:</span> ${concern.category}</p>
                <p><span class="label">Severity:</span> <span class="badge severity-${concern.severity.toLowerCase()}">${concern.severity}</span></p>
                <p><span class="label">Title:</span> ${concern.title}</p>
                <p><span class="label">Description:</span></p>
                <p style="background: #fff; padding: 10px; border-left: 3px solid #667eea;">${concern.description}</p>
                <p><span class="label">Submitted:</span> ${new Date(concern.createdAt).toLocaleString()}</p>
              </div>
              
              <p>Please log in to the admin portal to review and assign this concern.</p>
              
              <a href="${process.env.FRONTEND_URL}/admin/concerns/${concern._id}" class="button">View Concern</a>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to admin for concern ${concern.ticketId}`);
  } catch (error) {
    console.error('❌ Error sending email to admin:', error);
  }
};

// Send email to student when concern status is updated
export const sendStatusUpdateEmail = async (concern, student, updatedBy, comment = '') => {
  try {
    const statusColors = {
      'Submitted': '#3498db',
      'In Review': '#f39c12',
      'Assigned': '#9b59b6',
      'In Progress': '#e67e22',
      'Resolved': '#27ae60',
      'Closed': '#95a5a6',
      'Reopened': '#e74c3c'
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: student.email,
      subject: `📢 Concern Status Updated - ${concern.ticketId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .status-update { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusColors[concern.status]}; }
            .label { font-weight: bold; color: #667eea; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; background: ${statusColors[concern.status]}; color: white; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 Brototype - Concern Status Update</h2>
            </div>
            <div class="content">
              <p>Hello ${student.name},</p>
              <p>Your concern has been updated. Here are the details:</p>
              
              <div class="status-update">
                <p><span class="label">Ticket ID:</span> ${concern.ticketId}</p>
                <p><span class="label">Title:</span> ${concern.title}</p>
                <p><span class="label">New Status:</span> <span class="status-badge">${concern.status}</span></p>
                ${concern.assignedTo ? `<p><span class="label">Assigned To:</span> ${updatedBy.name}</p>` : ''}
                ${comment ? `<p><span class="label">Comment:</span></p><p style="background: #fff; padding: 10px; border-left: 3px solid #667eea;">${comment}</p>` : ''}
                <p><span class="label">Updated:</span> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>You can track your concern and communicate with the assigned mentor through the portal.</p>
              
              <a href="${process.env.FRONTEND_URL}/concerns/${concern._id}" class="button">View Concern</a>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to student ${student.email} for concern ${concern.ticketId}`);
  } catch (error) {
    console.error('❌ Error sending email to student:', error);
  }
};

// Send email when concern is assigned to a mentor
export const sendAssignmentEmail = async (concern, student, mentor) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: mentor.email,
      subject: `📋 New Concern Assigned - ${concern.ticketId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .concern-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .label { font-weight: bold; color: #667eea; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 Brototype - Concern Assigned to You</h2>
            </div>
            <div class="content">
              <p>Hello ${mentor.name},</p>
              <p>A new concern has been assigned to you. Please review and take appropriate action.</p>
              
              <div class="concern-details">
                <p><span class="label">Ticket ID:</span> ${concern.ticketId}</p>
                <p><span class="label">Student:</span> ${concern.isAnonymous ? 'Anonymous' : student.name}</p>
                <p><span class="label">Category:</span> ${concern.category}</p>
                <p><span class="label">Severity:</span> ${concern.severity}</p>
                <p><span class="label">Title:</span> ${concern.title}</p>
                <p><span class="label">Description:</span></p>
                <p style="background: #fff; padding: 10px; border-left: 3px solid #667eea;">${concern.description}</p>
              </div>
              
              <a href="${process.env.FRONTEND_URL}/admin/concerns/${concern._id}" class="button">View & Respond</a>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Assignment email sent to mentor ${mentor.email}`);
  } catch (error) {
    console.error('❌ Error sending assignment email:', error);
  }
};

export default transporter;
