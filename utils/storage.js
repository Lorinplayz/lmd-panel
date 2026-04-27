const fs = require('fs-extra');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function loadBackground() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readJsonSync(CONFIG_PATH);
      return data.background || { type: 'color', value: '#0a0e17' };
    }
  } catch (error) {}
  return { type: 'color', value: '#0a0e17' };
}

function saveBackground(background) {
  let config = { servers: [] };
  if (fs.existsSync(CONFIG_PATH)) {
    config = fs.readJsonSync(CONFIG_PATH);
  }
  config.background = background;
  fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
}

module.exports = { loadBackground, saveBackground };
