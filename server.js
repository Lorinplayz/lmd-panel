const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs-extra');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { initServerWatcher, getAllServers } = require('./utils/serverManager');
const { loadBackground, saveBackground } = require('./utils/storage');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Upload background image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'backgrounds');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `custom-bg${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// API Routes
app.use('/api', apiRoutes);

// Background upload endpoint
app.post('/api/upload-background', upload.single('background'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const bgType = req.body.type || 'image';
  const bgValue = bgType === 'image' 
    ? `/uploads/backgrounds/${req.file.filename}`
    : req.body.color;
  
  saveBackground({ type: bgType, value: bgValue });
  res.json({ success: true, background: { type: bgType, value: bgValue } });
});

app.get('/api/get-background', (req, res) => {
  const bg = loadBackground();
  res.json(bg);
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe-server', (serverId) => {
    socket.join(`server-${serverId}`);
  });
  
  socket.on('server-command', ({ serverId, command }) => {
    io.to(`server-${serverId}`).emit('console-output', { 
      type: 'command', 
      message: `> ${command}` 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize
initServerWatcher(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 LMD Panel running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🎮 Features: Create servers | Custom backgrounds | Real-time console\n`);
});
