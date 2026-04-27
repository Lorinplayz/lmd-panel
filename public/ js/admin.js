const socket = io();

let servers = [];

async function loadServers() {
    const res = await fetch('/api/servers');
    servers = await res.json();
    updateStats();
    renderServers();
}

function updateStats() {
    document.getElementById('totalServers').textContent = servers.length;
    const running = servers.filter(s => s.instance?.status === 'running').length;
    document.getElementById('runningServers').textContent = running;
    const players = servers.reduce((sum, s) => sum + (s.instance?.players || 0), 0);
    document.getElementById('totalPlayers').textContent = players;
}

function renderServers() {
    const tbody = document.getElementById('serversList');
    tbody.innerHTML = servers.map(server => `
        <tr>
            <td><i class="fas fa-cube"></i> ${escapeHtml(server.name)}</td>
            <td>${server.port}</td>
            <td>${server.memory} MB</td>
            <td><span class="status-badge status-${server.instance?.status || 'stopped'}">${server.instance?.status || 'stopped'}</span></td>
            <td>${server.instance?.players || 0}/20</td>
            <td class="actions">
                <button onclick="controlServer('${server.id}', 'start')" class="action-btn start"><i class="fas fa-play"></i></button>
                <button onclick="controlServer('${server.id}', 'stop')" class="action-btn stop"><i class="fas fa-stop"></i></button>
                <button onclick="deleteServer('${server.id}')" class="action-btn delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function controlServer(id, action) {
    await fetch(`/api/servers/${id}/${action}`, { method: 'POST' });
    loadServers();
}

async function deleteServer(id) {
    if (confirm('Delete this server?')) {
        await fetch(`/api/servers/${id}`, { method: 'DELETE' });
        loadServers();
    }
}

// Modal handling
const createModal = document.getElementById('createModal');
document.getElementById('createServerBtn').onclick = () => createModal.style.display = 'flex';
document.querySelector('.close').onclick = () => createModal.style.display = 'none';
document.getElementById('confirmCreate').onclick = async () => {
    const name = document.getElementById('serverName').value;
    const port = document.getElementById('serverPort').value;
    const memory = document.getElementById('serverMemory').value;
    if (name && port) {
        await fetch('/api/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, port, memory }) });
        createModal.style.display = 'none';
        loadServers();
    }
};

// Custom background
const customizeModal = document.getElementById('customizeModal');
document.getElementById('customizeBtn').onclick = () => customizeModal.style.display = 'flex';
document.querySelector('.close-custom').onclick = () => customizeModal.style.display = 'none';

document.querySelectorAll('.bg-option').forEach(btn => {
    btn.onclick = async () => {
        const formData = new FormData();
        formData.append('type', 'color');
        formData.append('color', btn.dataset.value);
        await fetch('/api/upload-background', { method: 'POST', body: formData });
        document.body.style.background = btn.dataset.value;
        customizeModal.style.display = 'none';
    };
});

document.getElementById('bgUploadForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await fetch('/api/upload-background', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.background.type === 'image') {
        document.body.style.background = `url(${data.background.value}) center/cover fixed`;
    }
    customizeModal.style.display = 'none';
};

function escapeHtml(str) { return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; }); }

socket.on('servers-update', () => loadServers());
loadServers();

// Load saved background
fetch('/api/get-background').then(res => res.json()).then(bg => {
    if (bg.type === 'color') document.body.style.background = bg.value;
    else document.body.style.background = `url(${bg.value}) center/cover fixed`;
});
