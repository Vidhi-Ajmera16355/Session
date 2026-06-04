const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const Razorpay = require('razorpay');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}
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

// POST /api/create-order - create Razorpay order
router.post('/create-order', registrationLimiter, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['workshop', 'oneonone'].includes(plan)) {
       return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }
    const amount = plan === 'workshop' ? 59 : 159;
    
    if (!razorpayInstance) {
       return res.status(500).json({ success: false, message: 'Razorpay is not configured on the server.' });
    }

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Server error while creating order.' });
  }
});

// POST /api/verify-payment - verify Razorpay signature and save registration
router.post('/verify-payment', registrationLimiter, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, formData } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const { name, phone, email, college, plan, goal } = formData;
    if (!name || !phone || !email || !college || !plan) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const amount = plan === 'workshop' ? 59 : 159;

    const existing = await Registration.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This payment has already been processed.' });
    }

    // Auto-confirm since payment was successful
    const registration = new Registration({ 
      name, phone, email, college, plan, amount, 
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentMethod: 'razorpay',
      status: 'confirmed',
      goal 
    });
    await registration.save();
    
    // Grant access directly
    const User = require('../models/User');
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { access: true }
    );

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('payment_received', { 
        name, 
        plan, 
        amount, 
        paymentId: razorpay_payment_id 
      });
    }

    // Send emails
    if (transporter) {
      const planLabel = plan === 'workshop' ? 'Group Workshop' : '1-on-1 Call';

      const userHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="margin:0;font-size:22px;color:#0f172a;">🎉 Registration Confirmed!</h2>
          </div>
          <p style="font-size:15px;color:#334155;line-height:1.6;">
            Hi <strong>${name}</strong>,
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.6;">
            Thank you for registering for the <strong>${planLabel}</strong>. We've received your payment and your seat is now <strong>confirmed</strong>.
          </p>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
            <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#64748b;">Plan</td><td style="padding:6px 0;text-align:right;font-weight:600;">${planLabel}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Amount</td><td style="padding:6px 0;text-align:right;font-weight:600;">₹${amount}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Payment ID</td><td style="padding:6px 0;text-align:right;font-weight:600;font-family:monospace;">${razorpay_payment_id}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">College</td><td style="padding:6px 0;text-align:right;font-weight:600;">${college}</td></tr>
            </table>
          </div>
          <p style="font-size:14px;color:#64748b;line-height:1.6;">
            ✅ You now have full access. Please log in with this email to access the session recording and materials.<br/>
            📱 You'll also receive a WhatsApp message with more details.
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
        subject: `✅ Payment Successful — ${planLabel} (₹${amount})`,
        html: userHtml
      }).catch(err => console.error('Email error:', err.message));

      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL,
        subject: `New Razorpay Payment: ${name} (${plan})`,
        text: `Name: ${name}\nEmail: ${email}\nCollege: ${college}\nPlan: ${plan}\nAmount: ₹${amount}\nPayment ID: ${razorpay_payment_id}\nGoal: ${goal}`
      }).catch(err => console.error('Admin email error:', err.message));
    }

    res.status(201).json({ success: true, message: 'Payment verified and registration successful!', id: registration._id });
  } catch (err) {
    console.error('Verify payment error:', err);
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
