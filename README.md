# FitSync - Fitness Tracking Application

A comprehensive fitness tracking application with AI-powered workout analysis, BMI calculator, and virtual training assistant.

## Features

- 🏋️ AI-powered workout analysis
- 📊 BMI calculator and tracking
- 🤖 Virtual training assistant
- 📱 Responsive design
- 🔐 User authentication
- 📈 Progress tracking
- 💬 Real-time messaging

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express.js, MongoDB
- **AI**: TensorFlow.js, MediaPipe
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd FitSync
```

2. Install dependencies:
```bash
npm install
cd Server && npm install
cd ..
```

3. Create environment variables:
Create a `.env` file in the root directory:
```env
MONGODB_URL=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

4. Run the development server:
```bash
npm run dev
```

This will start both frontend (port 5173) and backend (port 8000) servers concurrently.

## Deployment

### GitHub Setup

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub and push your code:
```bash
git remote add origin https://github.com/yourusername/fitsync.git
git branch -M main
git push -u origin main
```

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `MONGODB_URL`
   - `SESSION_SECRET`
   - `JWT_SECRET`
   - `NODE_ENV=production`

4. Update CORS origins in `Server/index.js` with your Vercel domain.

## Project Structure

```
FitSync/
├── src/                 # React frontend
├── Server/             # Node.js backend
├── AI/                 # AI models and utilities
├── public/             # Static assets
└── vercel.json         # Vercel configuration
```

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/bmi` - BMI calculations
- `/api/reports` - Reports and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
