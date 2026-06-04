const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

// Strict rate limiter for registration attempts (max 5 per hour per IP)
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again after an hour.' }
});

// Reuse the mail transporter globally instead of recreating it per request
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  } catch (err) {
    console.error('Failed to create mail transporter:', err.message);
  }
}

// POST /api/register - submit a new registration
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const { name, phone, email, college, plan, transactionId, goal } = req.body;

    if (!name || !phone || !email || !college || !plan || !transactionId) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const amount = plan === 'workshop' ? 59 : 159;

    // Check for duplicate transaction ID (now O(1) due to database index)
    const existing = await Registration.findOne({ transactionId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This transaction ID has already been used.' });
    }

    const registration = new Registration({ name, phone, email, college, plan, amount, transactionId, goal });
    await registration.save();

    //  Send emails asynchronously (non-blocking)
    if (transporter) {
      const planLabel = plan === 'workshop' ? 'Group Workshop' : '1-on-1 Call';

      // 1) Confirmation email → user
      const userHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="margin:0;font-size:22px;color:#0f172a;">🎉 Registration Confirmed!</h2>
          </div>
          <p style="font-size:15px;color:#334155;line-height:1.6;">
            Hi <strong>${name}</strong>,
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.6;">
            Thank you for registering for the <strong>${planLabel}</strong>. We've received your payment details and our team will verify it shortly.
          </p>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
            <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#64748b;">Plan</td><td style="padding:6px 0;text-align:right;font-weight:600;">${planLabel}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Amount</td><td style="padding:6px 0;text-align:right;font-weight:600;">₹${amount}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Transaction ID</td><td style="padding:6px 0;text-align:right;font-weight:600;font-family:monospace;">${transactionId}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">College</td><td style="padding:6px 0;text-align:right;font-weight:600;">${college}</td></tr>
            </table>
          </div>
          <p style="font-size:14px;color:#64748b;line-height:1.6;">
            ✅ Your seat will be confirmed within <strong>24 hours</strong> once payment is verified.<br/>
            📱 You'll also receive a WhatsApp message with session details.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p style="font-size:12px;color:#94a3b8;text-align:center;">
            Internship Playbook · From Campus to Goldman Sachs<br/>
            Sent from vidhi2005ajmera@gmail.com
          </p>
        </div>
      `;

      transporter.sendMail({
        from: `"Internship Playbook" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Registration received — ${planLabel} (₹${amount})`,
        html: userHtml
      }).then(() => {
        console.log(`✓ Confirmation email sent to ${email}`);
      }).catch(emailErr => {
        console.error(`✗ Confirmation email to ${email} failed:`, emailErr.message);
      });

      // 2) Notification email → admin
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL,
        subject: `New registration: ${name} (${plan})`,
        text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nCollege: ${college}\nPlan: ${plan}\nAmount: ₹${amount}\nUTR: ${transactionId}\nGoal: ${goal}`
      }).catch(emailErr => {
        console.error('Admin notification email failed:', emailErr.message);
      });
    }

    res.status(201).json({ success: true, message: 'Registration submitted successfully!', id: registration._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Middleware to authenticate admin requests using X-Admin-Token header
const authAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({ success: false, message: 'Admin access is not configured on the server.' });
  }
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid admin secret.' });
  }
  next();
};

// GET /api/registrations - admin view all registrations
router.get('/registrations', authAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ registeredAt: -1 }).lean();
    res.json({ success: true, data: registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/registrations/:id/status - confirm or reject a registration
router.patch('/registrations/:id/status', authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const reg = await Registration.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });

    // Sync with User access
    const User = require('../models/User');
    if (status === 'confirmed') {
      await User.findOneAndUpdate(
        { email: reg.email.toLowerCase() },
        { access: true }
      );
    } else {
      // If setting to pending or rejected, check if there are any other confirmed registrations for this email
      const otherConfirmed = await Registration.findOne({
        email: reg.email.toLowerCase(),
        status: 'confirmed',
        _id: { $ne: reg._id }
      });
      if (!otherConfirmed) {
        await User.findOneAndUpdate(
          { email: reg.email.toLowerCase() },
          { access: false }
        );
      }
    }

    res.json({ success: true, data: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
