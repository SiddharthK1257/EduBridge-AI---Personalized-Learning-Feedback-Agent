const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB & ensure auto-seeding if empty
connectDB().then(async () => {
  try {
    const Subject = require('./models/Subject');
    const count = await Subject.countDocuments();
    if (count === 0) {
      console.log('[Server] Subject catalog is empty. Auto-seeding initial data...');
      const seedDatabase = require('./utils/seedData');
      await seedDatabase();
    }
  } catch (seedCheckErr) {
    console.warn('[Server] Seed check error:', seedCheckErr.message);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'EduBridge AI Server is running smoothly',
    timestamp: new Date()
  });
});

// Root route handler for browser convenience
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>EduBridge AI Server</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; color: #0f172a;">
        <h1 style="color: #059669;">🚀 EduBridge AI Backend API is Online</h1>
        <p>The frontend application is running on port 3000.</p>
        <p><a href="http://localhost:3000" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Open EduBridge AI Web Application →</a></p>
      </body>
    </html>
  `);
});

const path = require('path');

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/api/chapters', require('./routes/chapterRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/studyplan', require('./routes/studyPlanRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/marksheet', require('./routes/marksheetRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Global Error Handler & 404
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 EduBridge AI Backend running on port http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
