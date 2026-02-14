# Dynamic QR Code

Create dynamic QR codes, update destinations anytime, and track every scan with real-time analytics.

**Live Demo →** [dynamic-qr-code.vercel.app](https://dynamic-qr-code.vercel.app)

---

## Features

- **Dynamic QR Codes** — Change the destination URL anytime without regenerating the QR code
- **Scan Analytics** — Track total scans, 7-day trends, device breakdown, and recent scan history
- **Google Sign-In** — Secure authentication with one click
- **Live Preview** — See the QR code update in real time as you type
- **Download as PNG** — Export your QR code for print or digital use
- **5 QR Code Limit** — Free tier with usage tracking per account
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer         | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language      | TypeScript                                                |
| Styling       | Tailwind CSS 4                                            |
| Auth          | Firebase Authentication (Google)                          |
| Database      | Cloud Firestore                                           |
| QR Generation | [qrcode](https://www.npmjs.com/package/qrcode)            |
| Icons         | [Lucide React](https://lucide.dev/)                       |
| Deployment    | [Vercel](https://vercel.com/)                             |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Login page
│   ├── layout.tsx                  # Root layout with AuthProvider
│   ├── globals.css                 # Design system tokens
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard — QR code grid
│   │   ├── create/
│   │   │   └── page.tsx            # Create new QR code
│   │   └── qr/
│   │       └── [id]/
│   │           └── page.tsx        # QR detail — analytics & editing
│   └── api/
│       └── scan/
│           └── [code]/
│               └── route.ts        # Scan redirect API
├── context/
│   └── auth-context.tsx            # Auth state management
└── lib/
    ├── firebase.ts                 # Firebase initialization
    ├── firestore.ts                # Firestore CRUD operations
    └── nanoid.ts                   # Short code generator
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase project](https://console.firebase.google.com/) with:
  - Authentication (Google sign-in enabled)
  - Cloud Firestore (native mode)

### 1. Clone the repository

```bash
git clone https://github.com/tamilarasu18/dynamic-qr-code.git
cd dynamic-qr-code
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Firebase config:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

```
User creates QR → Points to /api/scan/:code → Logs scan → Redirects to target URL
```

1. **Create** — User enters a destination URL and label. A unique short code is generated.
2. **Scan** — Anyone scanning the QR hits `/api/scan/:code`, which logs analytics and redirects to the target.
3. **Edit** — The destination URL can be changed anytime from the detail page — the QR code stays the same.
4. **Track** — Every scan is logged with timestamp, user agent, and referrer for analytics.

## Firestore Data Model

```
users/{uid}
  ├── displayName, email, photoURL
  ├── qrCodeCount: number
  └── createdAt: timestamp

qrCodes/{id}
  ├── userId, shortCode, targetUrl, label
  ├── scanCount: number
  ├── createdAt, updatedAt: timestamp

scans/{id}
  ├── qrCodeId, userId
  ├── timestamp, userAgent, referrer, country
```

## Deployment

### Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in **Settings → Environment Variables**
4. Add your Vercel domain to **Firebase Console → Authentication → Settings → Authorized domains**
5. Deploy

## License

MIT
