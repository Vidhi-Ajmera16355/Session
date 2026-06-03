# Internship Playbook — MERN Website

## Project Structure
```
internship-guide/
├── client/          ← React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Hero.js
│       │   ├── Journey.js
│       │   ├── WhatYouGet.js
│       │   ├── Pricing.js
│       │   ├── RegistrationForm.js
│       │   └── Footer.js
│       ├── App.js
│       ├── index.js
│       └── index.css
└── server/          ← Express + MongoDB backend
    ├── models/
    │   └── Registration.js
    ├── routes/
    │   └── registration.js
    ├── index.js
    ├── .env
    └── package.json
```

---

## 🚀 Setup Instructions

### Step 1 — MongoDB
**Option A: Local MongoDB**
- Install MongoDB: https://www.mongodb.com/try/download/community
- It runs on `mongodb://localhost:27017` by default

**Option B: MongoDB Atlas (free cloud DB — recommended)**
1. Go to https://cloud.mongodb.com → create free account
2. Create a cluster → click "Connect" → get connection string
3. Paste it in `server/.env` as `MONGODB_URI`

---

### Step 2 — Configure your details

Open `server/.env` and fill in:
```
MONGODB_URI=your_mongodb_connection_string
```

Open `client/src/components/RegistrationForm.js` and find line:
```js
const UPI_ID = 'yourname@upi'; // ← Replace with your actual UPI ID
```
Replace with your real Paytm/GPay/PhonePe UPI ID.

**To add your QR code image:**
When you open the website, in the registration section you'll see a "Click to upload QR" area.
You (as the site owner) should upload your Paytm QR image there ONCE and it'll show to users.
> For a permanent QR image: put your QR image file at `client/public/qr.png` and in RegistrationForm.js set: `const [qrPreview, setQrPreview] = useState('/qr.png');`

---

### Step 3 — Install dependencies & run

```bash
# Terminal 1 — Backend
cd server
npm install
npm run dev    # runs on http://localhost:5000

# Terminal 2 — Frontend
cd client
npm install
npm start      # runs on http://localhost:3000
```

---

### Step 4 — View registrations (admin)

Hit this URL to see all registrations as JSON:
```
GET http://localhost:5000/api/registrations
```

To confirm/reject a registration:
```
PATCH http://localhost:5000/api/registrations/:id/status
Body: { "status": "confirmed" }
```

---

## 🌐 Deploying online (free)

### Frontend → Vercel (free)
```bash
cd client
npm run build
# Deploy the build/ folder to https://vercel.com
```

### Backend → Render (free)
1. Push code to GitHub
2. Go to https://render.com → New Web Service → connect repo
3. Set root dir to `server`, build command `npm install`, start command `npm start`
4. Add environment variables from .env in Render dashboard

### Or use Railway (easier, both together)
https://railway.app — deploy both client and server from one GitHub repo

---

## ✏️ Key customisations

| What to change | Where |
|---|---|
| Your UPI ID | `client/src/components/RegistrationForm.js` → `UPI_ID` |
| Your QR image | Upload at runtime OR put `qr.png` in `client/public/` |
| Workshop price | Already set to ₹59 / ₹159 in Pricing.js and routes/registration.js |
| Deadlines | `client/src/components/Hero.js` |
| Your name / branding | `client/src/components/Footer.js` |
| Session topics | `client/src/components/WhatYouGet.js` |
