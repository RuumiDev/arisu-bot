const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'data', 'admins.json');

// Ensure the file exists
function loadAdmins() {
  if (!fs.existsSync(adminPath)) {
    fs.writeFileSync(adminPath, JSON.stringify({ admins: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(adminPath)).admins;
}

function saveAdmins(admins) {
  fs.writeFileSync(adminPath, JSON.stringify({ admins }, null, 2));
}

// Normalizes @lid to @c.us
function normalizeId(id) {
  if (!id) return '';
  if (id.endsWith('@lid')) {
    const num = id.split('@')[0];
    return `${num}@c.us`;
  }
  return id;
}

// Check if user is an admin
function isAdmin(message) {
  let senderId;

  if (message.author) {
    // In group chats
    senderId = message.author;
  } else if (message.from && message.from.endsWith('@c.us')) {
    // In personal chats
    senderId = message.from;
  } else {
    return false; // Unknown case
  }

  // Normalize @lid → @c.us if needed
  if (senderId.endsWith('@lid')) {
    senderId = senderId.replace('@lid', '@c.us');
  }

  const admins = loadAdmins(); // from admins.json
  return admins.includes(senderId);
}



module.exports = {
  loadAdmins,
  saveAdmins,
  isAdmin,
};




