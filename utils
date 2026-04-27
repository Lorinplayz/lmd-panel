const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SERVERS_DIR = path.join(__dirname, '..', 'servers');
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

let activeServers = new Map();
let serversList = [];

// Load servers from config
function loadServers() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readJsonSync(CONFIG_PATH);
      serversList = data.servers || [];
    } else {
      serversList = [];
      saveServers();
    }
  } catch (error) {
    console.error('Error loading servers:', error);
    serversList = [];
  }
  return serversList;
}

function saveServers() {
  fs.writeJsonSync(CONFIG_PATH, { servers: serversList }, { spaces: 2 });
}

class MinecraftServer {
  constructor(id, name, port, memory, jarFile = 'server.jar') {
    this.id = id;
    this.name = name;
    this.port = port;
    this.memory = memory;
    this.jarFile = jarFile;
    this.process = null;
    this.status = 'stopped';
    this.players = 0;
    this.output = [];
  }
  
  start() {
    if (this.process) return { success: false, message: 'Server already running' };
    
    const serverPath = path.join(SERVERS_DIR, this.id);
    fs.ensureDirSync(serverPath);
    
    // Create simple start script
    const javaArgs = `-Xms${this.memory}M -Xmx${this.memory}M -jar ${this.jarFile} nogui`;
    
    this.process = spawn('java', javaArgs.split(' '), {
      cwd: serverPath,
      shell: true
    });
    
    this.status = 'starting';
    
    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      this.output.push(output);
      if (this.output.length > 1000) this.output.shift();
      
      if (output.includes('Done') || output.includes('For help')) {
        this.status = 'running';
      }
    });
    
    this.process.stderr.on('data', (data) => {
      this.output.push(data.toString());
    });
    
    this.process.on('close', () => {
      this.process = null;
      this.status = 'stopped';
      this.players = 0;
    });
    
    return { success: true, message: 'Server starting...' };
  }
  
  stop() {
    if (!this.process) return { success: false, message: 'Server not running' };
    this.process.stdin.write('stop\n');
    return { success: true, message: 'Stopping server...' };
  }
  
  restart() {
    this.stop();
    setTimeout(() => this.start(), 3000);
    return { success: true, message: 'Restarting...' };
  }
  
  sendCommand(cmd) {
    if (!this.process) return { success: false, message: 'Server not running' };
    this.process.stdin.write(cmd + '\n');
    return { success: true };
  }
  
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      players: this.players,
      port: this.port,
      memory: this.memory
    };
  }
}

function createServer(name, port, memory) {
  const id = uuidv4();
  const newServer = {
    id,
    name,
    port: parseInt(port),
    memory: parseInt(memory),
    createdAt: new Date().toISOString()
  };
  
  serversList.push(newServer);
  saveServers();
  
  // Create server directory
  const serverPath = path.join(SERVERS_DIR, id);
  fs.ensureDirSync(serverPath);
  
  // Create eula.txt
  fs.writeFileSync(path.join(serverPath, 'eula.txt'), 'eula=true');
  
  // Create server.properties template
  const props = `server-port=${port}\nmax-players=20\nonline-mode=false\nlevel-name=world\n`;
  fs.writeFileSync(path.join(serverPath, 'server.properties'), props);
  
  return newServer;
}

function deleteServer(id) {
  const index = serversList.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  // Stop server if running
  if (activeServers.has(id)) {
    activeServers.get(id).stop();
    activeServers.delete(id);
  }
  
  serversList.splice(index, 1);
  saveServers();
  
  // Optionally delete files (commented for safety)
  // fs.removeSync(path.join(SERVERS_DIR, id));
  
  return true;
}

function initServerWatcher(io) {
  loadServers();
  
  // Initialize existing servers
  serversList.forEach(server => {
    const mcServer = new MinecraftServer(server.id, server.name, server.port, server.memory);
    activeServers.set(server.id, mcServer);
  });
  
  // Send updates every 2 seconds
  setInterval(() => {
    const allStatus = Array.from(activeServers.values()).map(s => s.getStatus());
    io.emit('servers-update', allStatus);
  }, 2000);
  
  return { getAllServers: () => serversList, getServerInstance: (id) => activeServers.get(id) };
}

module.exports = {
  initServerWatcher,
  createServer,
  deleteServer,
  getServers: () => serversList,
  getServerInstance: (id) => activeServers.get(id),
  getAllServers: () => serversList
};
