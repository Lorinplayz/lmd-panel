const express = require('express');
const router = express.Router();
const { createServer, deleteServer, getServers, getServerInstance } = require('../utils/serverManager');

// Get all servers
router.get('/servers', (req, res) => {
  const servers = getServers().map(s => ({
    ...s,
    instance: getServerInstance(s.id)?.getStatus() || { status: 'stopped', players: 0 }
  }));
  res.json(servers);
});

// Create server
router.post('/servers', (req, res) => {
  const { name, port, memory } = req.body;
  
  if (!name || !port || !memory) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check port availability
  const existing = getServers().find(s => s.port === parseInt(port));
  if (existing) {
    return res.status(400).json({ error: 'Port already in use' });
  }
  
  const newServer = createServer(name, port, memory);
  res.json({ success: true, server: newServer });
});

// Delete server
router.delete('/servers/:id', (req, res) => {
  const deleted = deleteServer(req.params.id);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Server not found' });
  }
});

// Server actions
router.post('/servers/:id/start', (req, res) => {
  const server = getServerInstance(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const result = server.start();
  res.json(result);
});

router.post('/servers/:id/stop', (req, res) => {
  const server = getServerInstance(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const result = server.stop();
  res.json(result);
});

router.post('/servers/:id/restart', (req, res) => {
  const server = getServerInstance(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const result = server.restart();
  res.json(result);
});

router.post('/servers/:id/command', (req, res) => {
  const server = getServerInstance(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const { command } = req.body;
  const result = server.sendCommand(command);
  res.json(result);
});

router.get('/servers/:id/console', (req, res) => {
  const server = getServerInstance(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  res.json({ output: server.output.slice(-100) });
});

module.exports = router;
