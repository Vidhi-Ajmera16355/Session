const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const axios = require('axios');

// Cashfree Configuration
const CASHFREE_BASE_URL = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

const getCashfreeHeaders = () => ({
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  'x-api-version': '2023-08-01',
  'Content-Type': 'application/json'
});

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

// POST /api/create-order - create Cashfree order
router.post('/create-order', registrationLimiter, async (req, res) => {
  try {
    const { plan, formData } = req.body;
    if (!['workshop', 'oneonone'].includes(plan)) {
       return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }
    const amount = plan === 'workshop' ? 59 : 159;
    
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
       return res.status(500).json({ success: false, message: 'Cashfree is not configured on the server.' });
    }

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payload = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: formData?.name || "Customer",
        customer_email: formData?.email || "customer@example.com",
        customer_phone: formData?.phone || "9999999999"
      },
      order_meta: {
        // Return URL for redirect flow if needed, though we primarily use modal
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?order_id={order_id}`
      }
    };

    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, payload, {
      headers: getCashfreeHeaders()
    });

    res.json({ 
      success: true, 
      orderId: response.data.order_id, 
      paymentSessionId: response.data.payment_session_id,
      amount: amount
    });
  } catch (err) {
    console.error('Create order error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Server error while creating order.' });
  }
});

// POST /api/verify-payment - verify Cashfree payment status
router.post('/verify-payment', registrationLimiter, async (req, res) => {
  try {
    const { orderId, formData } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    // Verify payment status with Cashfree
    const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      headers: getCashfreeHeaders()
    });

    const orderData = response.data;

    if (orderData.order_status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Payment not successful or pending.' });
    }

    const { name, phone, email, college, plan, goal } = formData;
    if (!name || !phone || !email || !college || !plan) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const amount = plan === 'workshop' ? 59 : 159;

    const existing = await Registration.findOne({ cashfreeOrderId: orderId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This payment has already been processed.' });
    }

    // Auto-confirm since payment was successful
    const registration = new Registration({ 
      name, phone, email, college, plan, amount, 
      cashfreeOrderId: orderId,
      cashfreePaymentSessionId: orderData.payment_session_id || '',
      transactionId: orderId, // Populate transactionId for Admin panel
      paymentMethod: 'cashfree',
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
        paymentId: orderId 
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
              <tr><td style="padding:6px 0;color:#64748b;">Order ID</td><td style="padding:6px 0;text-align:right;font-weight:600;font-family:monospace;">${orderId}</td></tr>
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
        subject: `New Payment (Cashfree): ${name} (${plan})`,
        text: `Name: ${name}\nEmail: ${email}\nCollege: ${college}\nPlan: ${plan}\nAmount: ₹${amount}\nOrder ID: ${orderId}\nGoal: ${goal}`
      }).catch(err => console.error('Admin email error:', err.message));
    }

    res.status(201).json({ success: true, message: 'Payment verified and registration successful!', id: registration._id });
  } catch (err) {
    console.error('Verify payment error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Server error verifying payment. Please try again.' });
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
