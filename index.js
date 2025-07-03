// This is the main bot file for Arisu.AI, a WhatsApp bot designed to assist users with various tasks.
console.log("⏳ Arisu's system is booting up, please stand by ~!")

const sharp = require("sharp");
const fs = require('fs');
const path = require('path');
const axios = require ('axios')
const exportPath = path.join(__dirname, 'data', 'rent-export.json');
const welcomeDataPath = './data/welcome.json';

//GifToMp4Attachment
const { fetchTenorGif } = require('./tenorUtils');
const { gifToMp4 } = require('./mediaUtils');

// Image to Sticker
const { convertToWebpSticker } = require("./utils/stickerUtils");


// Example call wrapped inside an async function

/*async function testGifConversion() {
  try {
    const apiResponse = await axios.get('https://nekos.best/api/v2/pat');
    const gifUrl = "https://media.tenor.com/kYkYzP3tbLIAAAAC/anime-pat.gif"; // Hardcoded test
    console.log("📦 Testing with direct GIF URL:", gifUrl);

    const outputPath = await gifToWebp(gifUrl);
    const media = MessageMedia.fromFilePath(outputPath);
    console.log("🎞 Media Info:");
    console.log("MimeType:", media.mimetype);
    console.log("Filename:", media.filename);
    console.log("Media length:", media.data?.length);


    console.log("🎞 Media loaded:");
    console.log("   MimeType:", media.mimetype);
    console.log("   Filename:", media.filename);
    console.log("   Data length:", media.data?.length);

    media.mimetype = 'video/mp4';

    await client.sendMessage(message.from, media, {
      sendVideoAsGif: false,
      sendMediaAsSticker: false,
      caption: "Testing MP4 delivery!"
    });

    console.log("✅ MP4 saved at:", outputPath);
  } catch (err) {
    console.error("❌ Conversion failed:", err);
  }
}*/

//testGifConversion();

const {
  loadRent,
  saveRent,
  getCurrentMonth,
  ensureMonthExists,
  rentPath,
  loadJSON,
  saveJSON
} = require('./rent-tracker');


let welcomeMessages = {};

if (fs.existsSync(welcomeDataPath)) {
    try {
        welcomeMessages = JSON.parse(fs.readFileSync(welcomeDataPath));
    } catch (err) {
        console.error("❌ Error parsing welcome.json:", err.message);
        welcomeMessages = {};
    }
} else {
    fs.writeFileSync(welcomeDataPath, JSON.stringify({}, null, 2));
}

function saveWelcomeData() {
    fs.writeFileSync(welcomeDataPath, JSON.stringify(welcomeMessages, null, 2));
}

const billsPaidPath = './data/bills-paid.json';
if (!fs.existsSync(billsPaidPath)) fs.writeFileSync(billsPaidPath, '[]');
const paidBills = loadJSON(billsPaidPath);
const Rent = require('./rent-tracker');
const rentData = Rent.loadRent();
const currentMonth = Rent.ensureMonthExists(rentData); // ✅ currentMonth is now safe
Rent.saveRent(rentData);
const rentDataPath = loadJSON(rentPath); // Load rent data from file


const { isAdmin } = require('./utils/admin'); // Admin check utility
const mime = require('mime-types'); // For handling file types

/*console.log("SAVING RENT DATA:", rentData);
console.log("Current Month:", currentMonth);
console.log("rentData[currentMonth]:", rentData[currentMonth]);*/

const afkPath = path.join(__dirname, 'data', 'afk.json');
let afkStatus = fs.existsSync(afkPath)
  ? JSON.parse(fs.readFileSync(afkPath))
  : {};

function saveAfk() {
  fs.writeFileSync(afkPath, JSON.stringify(afkStatus, null, 2));
}

function pickRandom(arr){
        return arr[Math.floor(Math.random()*arr.length)];
}



const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


const client = new Client({ // This uses local storage to remember login session
    authStrategy: new LocalAuth()
});



const warnings = {};  // Stores warning counts per user
const muted = {};     // Stores muted users with expiration


const reactions = require('./reactions');


const todoPath = './data/todo.json';
const quotesPath = './data/quotes.json';
const billsPath = './data/bills.json';
const eventsPath = './data/events.json';

const RentAI = require('./rent-ai');// AI Arisu integration for !rent
const { getArisuReply } = require('./arisu-ai'); // AI integration for Arisu
const { askArisu } = require('./arisu-ai'); // AI integration for Arisu
const { generateArisuResponse } = require('./arisu-ai'); // AI response generation

const reminders = {};

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(todoPath)) fs.writeFileSync(todoPath, '[]');
if (!fs.existsSync(quotesPath)) fs.writeFileSync(quotesPath, '[]');
if (!fs.existsSync(billsPath)) fs.writeFileSync(billsPath, '[]');
if (!fs.existsSync(eventsPath)) fs.writeFileSync(eventsPath, '[]');




client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('☑ Code Accepted, Initializing . . .');
});


client.on('ready', () => {
    console.log('🟢 Arisu system is online sensei ~!!!');
});

require('./events/onJoinArisu')(client);

// Handle group join notifications
client.on('group_join', async (notification) => {
    try {
        const chat = await notification.getChat();
        const chatId = chat.id._serialized;
        const participantId = notification.recipientIds?.[0];

        if (!participantId) return;

        const contact = await client.getContactById(participantId);
        const welcomeData = loadJSON('./data/welcome.json');
        const template = welcomeData[chatId]?.welcome || "📥 @user has joined @group!!";

        const message = template
            .replace(/@user/gi, `@${contact.number}`)
            .replace(/@group/gi, chat.name);

        await chat.sendMessage(message, {
            mentions: [contact] // ✅ tags user correctly
        });

        console.log(`[JOIN] Welcomed: ${contact.pushname || contact.number} to ${chat.name}`);
    } catch (err) {
        console.error('❌ Error sending welcome message:', err);
    }
});



//handle group leave notifications

client.on('group_leave', async (notification) => {
    try {
        const chat = await notification.getChat();
        const chatId = chat.id._serialized;
        const participantId = notification.recipientIds?.[0];

        if (!participantId) return;

        const contact = await client.getContactById(participantId);
        const welcomeData = loadJSON('./data/welcome.json');
        const template = welcomeData[chatId]?.goodbye || "📤 @user has left @group...";

        const message = template
            .replace(/@user/gi, `@${contact.number}`)
            .replace(/@group/gi, chat.name);

        await chat.sendMessage(message, {
            mentions: [contact] // ✅ highlights user
        });

        console.log(`[LEAVE] Said goodbye to: ${contact.pushname || contact.number} from ${chat.name}`);
    } catch (err) {
        console.error('❌ Error sending goodbye message:', err);
    }
});


client.on('message', async message => {
        const textLower = message.body.toLowerCase();
});

// Detect language function
function detectLang(text) {
  const malayWords = ["tak", "kau", "jap", "weh", "bukan", "saja", "dah", "ke", "aku", "lah", "ni", "pun", "sini", "tu", "sana", "macam", "cakap", "boleh", "ada", "apa", "yang", "dengan", "saya", "kita", "awak", "dia", "mereka", "sini", "situ", "sana", "sikit", "banyak", "sedikit", "semua", "semalam", "hari ini", "esok", "minggu ini", "bulan ini", "tahun ini", "sekarang", "nanti", "tadi", "baru", "lama", "sudah", "belum", "pergi", "datang", "balik", "tunggu", "jangan", "boleh", "tak boleh", "kenapa", "macam mana", "apa khabar", "baik-baik saja", "sihat", "okey", "bagus", "terima kasih", "maaf", "tolong", "sila", "selamat", "jumpa", "jumpa lagi", "selamat tinggal", "selamat pagi", "selamat petang", "selamat malam", "selamat datang", "sama-sama", "tak apa", "tak kisah", "tak pe", "takde masalah", "takde hal", "takde apa-apa", "takde apa-apa pun", "takde apa-apa yang penting", "takde apa-apa yang perlu risaukan", "takde apa-apa yang perlu difikirkan", "takde apa-apa yang perlu dibimbangkan", "takde apa-apa yang perlu dikesalkan", "takde apa-apa yang perlu disesalkan", "takde apa-apa yang perlu ditakutkan", "takde apa-apa yang perlu dirisaukan", "takde apa-apa yang perlu diambil peduli", "takde apa-apa yang perlu diambil berat", "takde apa-apa yang perlu diambil kira"];
  const wordList = text.toLowerCase().split(/\s+/);
  const malayScore = wordList.filter(word => malayWords.includes(word)).length;
  return malayScore >= 2 ? "ms" : "en";
}

// Parse AFK intent from message text
function parseAfkIntent(text) {
  const lower = text.toLowerCase();

  // Only activate if there's a proper AFK context
  const intentKeywords = [
    "nak", "kena", "pergi", "gonna", "going to", "need to", "have to",
    "afk", "rest", "rehat", "wash", "shower", "eat", "makan",
    "mandi", "solat", "pray", "sleep", "tidur", "toilet", "game", "ml", "push", "rank"
  ];

  const softAfkCheck = intentKeywords.some(word => lower.includes(word));

  // Addressed to Arisu naturally (not just mentions her name)
  const isDirected = (
    lower.startsWith("arisu") ||
    lower.includes("arisu jap") ||
    lower.includes("arisu aku nak") ||
    lower.includes("arisu nk") ||
    /nak.*arisu|arisu.*nak/.test(lower)
  );

  if (softAfkCheck && isDirected) {
    const start = lower.indexOf("nak") !== -1 ? lower.indexOf("nak") : 0;
    const reason = text.slice(start).trim();
    return reason || "AFK";
  }

  return null;
}


function getTimeString(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day(s)`;
  if (hours > 0) return `${hours} hour(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `${seconds} seconds`;
}


// Format AFK time function
function formatAfkTime(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (60 * 1000)) % 60;
  const hours = Math.floor(ms / (60 * 60 * 1000)) % 24;
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));

  let parts = [];
  if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds && parts.length === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

  return parts.join(', ');
}

// Normalize ID function
function normalizeId(id) {
  if (!id) return '';
  if (id.endsWith('@c.us')) return id;
  if (id.endsWith('@lid')) return id.replace('@lid', '@c.us');
  return id;
}


// Anime Reactions Function
async function animeReactionCommand(message, textLower, commandName, endpoint, actionText, isNyaaMode, uwuify, client) {
  const mentioned = message.mentionedIds;
  const args = textLower.trim().split(' ');
  let targetText = mentioned.length > 0 ? args.slice(1).join(' ') : 'you, Sensei~';
  
  if (uwuify) targetText = uwuify(targetText);
  if (isNyaaMode) actionText = actionText + '~nyaa';

  const actionLine = `*${actionText} ${targetText}*`;

  const loadingMsg = await message.reply("Arisu is summoning waifu magic~ 💫");

  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${endpoint}`);
    const imageUrl = res.data.url;

    console.log(`🎴 Waifu URL: ${imageUrl}`);

    await client.sendMessage(message.from, await MessageMedia.fromUrl(imageUrl), {
      caption: actionLine
    });

    console.log("✅ Sent waifu image successfully!");

  } catch (err) {
    console.error("❌ Waifu.pics Error:", err.message);
    message.reply("Uwaa~ I couldn’t send the waifu image, Sensei TwT");
  }
}




function uwuify(textLower) {
    return textLower
        .replace(/r|l/g, "w")
        .replace(/R|L/g, "W")
        .replace(/n([aeiou])/gi, "ny$1")
        .replace(/ove/gi, "uv")
        .replace(/!+/g, " nya~!")
        .concat(" >w<");
}
// Nyaa mode, which makes the bot respond in a cute way
let isNyaaMode = false;



//EmojiBarStatus
function generateBarChart(progress) {
    const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const count = Math.round(progress * (bars.length - 1));
    return bars[count].repeat(8);
}


// User data storage, where registered users' names are stored ////////////////////////////////////////////////////////////////////////////////////
const userData = { };

client.on('message', async message => {
  const textRaw = message.body?.trim() || '';
  const textLower = textRaw.toLowerCase();
  
  console.log("Incoming textraw:", textRaw);
  console.log("Lowercased text:", textLower);
    
    // Load AFK data
    let afkData = {};
    try {
      const raw = fs.readFileSync(afkPath, 'utf-8');
      afkData = JSON.parse(raw);
    } catch (e) {
      console.warn("AFK data not found or invalid, starting fresh.");
    }

    // Get sender ID — works for DM and group
    const senderId = message.author || message.from;
    const normalizeId = id => id.replace('@lid', '@c.us');
    const normalizedSender = normalizeId(senderId);


    // ✅ Remove AFK status if sender is in AFK/////////////////////////////////////////////////////////////////////////////////////////////////////////
    if (afkData[normalizedSender] && !textLower.startsWith('!afk') && !textLower.startsWith('!back')) {
      const afkSince = afkData[normalizedSender].time;
      const now = Date.now();
      const timeString = getTimeString(now - afkSince);

      delete afkData[normalizedSender];
      fs.writeFileSync(afkPath, JSON.stringify(afkData, null, 2));

        const afkReplies = [
            `Okaeri, Sensei~ Been ${timeString.trim()}! Arisu missed you~`,
            `Yatta! Sensei’s back after ${timeString.trim()} 🎉`,
            `Ehehe~ ${timeString.trim()} without Sensei felt so long… Welcome back!`,
            `Humuu~ You’ve been AFK for ${timeString.trim()}, but Arisu held the fort!`,
            `Sensei is finally back~ ${timeString.trim()} of silence `,
            `Uwaa~ that was ${timeString.trim()}! Arisu waited patiently~`,
            `Ehh? You were gone for ${timeString.trim()}?? Sensei jangan ghost Arisu tau~!`,
            `Ehehe~ Sensei dah muncul balik! ${timeString} menghilang...`,
            `Arisu standby je tadi~ Welcome back Sensei! (${timeString})`,
            `Akhirnya~ Sensei kembali dari exile lepas ${timeString}!`,
            `Hmph! ${timeString} away... Arisu almost filed a missing report tau~`,
            `Takpe takpe~ Arisu forgive you! Tapi jangan hilang ${timeString} lagi okay~`,
            `Mhm~ AFK ${timeString} only? Arisu approve! Now get back to work, Sensei~ 😏`
        
          ];
          const chosen = afkReplies[Math.floor(Math.random() * afkReplies.length)];
          return await message.reply(chosen);
    }



    //Arisu's Bot Commands Index //////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    if (textLower === '!checkadmin') {
        const rawId = message.author || (message.from.endsWith('@c.us') ? message.from : null);
        const id = rawId?.replace('@lid', '@c.us');
        const admins = loadAdmins();

        message.reply(
            `🔍 ID: ${id}\n` +
            `👑 Is Admin: ${admins.includes(id)}\n` +
            `🧠 Raw ID: ${rawId}\n` +
            `📋 Current Admins: ${admins.join(', ')}`
        );
    }


    if (textLower === '!id') {
  console.log('author:', message.author);
  console.log('from:', message.from);
  console.log('sender:', message._data?.id?.participant || message.id.participant);
  return message.reply('🧪 Debugging IDs… check console!');
    }

    // !introduce command
    if (textLower === '!introduce' || textLower.includes('arisu, introduce yourself')) {
    try {
        const moment = require('moment');
        const currentHour = moment().hour();

        let timeGreeting = "Let's do this";
        if (currentHour >= 5 && currentHour < 12) {
            timeGreeting = "Good morning, time to grind";
        } else if (currentHour >= 12 && currentHour < 18) {
            timeGreeting = "Hope your afternoon’s going well";
        } else if (currentHour >= 18 && currentHour < 22) {
            timeGreeting = "Evening mode active";
        } else {
            timeGreeting = "Late night systems fully operational";
        }

        const chat = await message.getChat();
        const groupName = chat?.name || "this group";

        await message.reply(
            `✨ Bum bum bum! Arisu has joined the team in ${groupName}.\n\n` +
            `I'm your support unit, here to keep things running smoothly.\n` +
            `Reminders, bills, the usual chaos — just leave it to me!!\n\n` +
            `Arisu is still figuring humans out, but Arisu will try her best!\n` +
            `${timeGreeting}, Sensei. ✨\n\n` +
            `_Also... I might’ve skimmed the chat history. You guys are wild.._`
        );

        console.log(`✅ Arisu introduced herself in: ${groupName}`);
    } catch (err) {
        console.error("❌ Error in Arisu's introduction:", err);
        await message.reply("System glitch... I couldn’t introduce myself, Sensei ...");
    }
    }



    // Greeting Arisu directly
    if (textLower === '!arisu') {
        message.reply("Panpakapan! Arisu is here, Sensei. How may I assist you today?");
        console.log("Sender ID:", message.from);
    }

    // Greetings
    if (textLower === '!hello' || textLower === '!hi' || textLower === '!hey') {
        message.reply("Hello, Sensei. How may I assist you today?");
    }

    // Ping test
    if (textLower === '!ping') {
        message.reply("Pong!!! Arisu system operational.");
    }

    // About command
    if (textLower === '!about') {
        message.reply(
    `Arisu.exe // al1s v1.0
    📌 Functions: Reminders, announcements, replies
    📡 Status: Active 
    👤 Owner: Hirumi Sensei~
    `
        );
    }

    //!say command
    if (textLower.startsWith('!say ')) {
    const toSay = textLower.slice(5).trim();
    if (toSay.length === 0) {
        message.reply("What would you like me to say, Sensei?");
    } else {
        message.reply(`Sensei, ${toSay}`);
    }
    } 


    //!register command
    if (textLower.startsWith('!register ')) {
    const name = textLower.slice(10).trim();
    if (!name) {
        message.reply("Please provide a name, Sensei.");
    } else {
        userData[message.from] = name;
        message.reply(`Registration complete. Hello, ${name} Sensei.`);
    }
    }


    //!quote
    if (textLower === '!quote') {
        const quotes = [
            "Even small steps can lead to big changes, Sensei.",
            "Processing... Conclusion: You are doing your best, and that is enough.",
            "The mission continues. Keep going, Sensei."
        ];
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        message.reply(random);
    }


    //!remind
    if (textLower.startsWith('!remind')) {
    const args = textLower.split(' ');

    // Format: !remind [time] [message]
    if (args.length < 3) {
        message.reply("Sensei, please !remind [time] [message]\nExample: !remind 10s drink water");
        return;
    }
    if (args.length > 4) {
        message.reply("Sensei, please use a shorter remind message !.");
        return;
    }

    const timeStr = args[1]; // e.g. 10s, 5m
    const timeValue = parseInt(timeStr);
    const timeUnit = timeStr.slice(-1);
    const reminderMsg = args.slice(2).join(' ');

    let delay;

    if (timeUnit === 's') delay = timeValue * 1000;
    else if (timeUnit === 'm') delay = timeValue * 60000;
    else {
        message.reply("Sensei, that's an unknown time unit. You can use 's' for seconds or 'm' for minutes.");
        return;
    }

    message.reply(`Wakatta, Sensei. I will remind you to ${reminderMsg} in ${timeValue}${timeUnit}.`);

    setTimeout(() => {
        message.reply(`Sensei!! Your reminder for ${reminderMsg}, is up!!`);
    }, delay);
    }


    //!time 
    if (textLower === '!time') {
        const now = new Date().toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        message.reply(`⏰ Current time: ${now}, Sensei.`);
    }


    //!date
    if (textLower === '!date') {
        const today = new Date().toLocaleDateString('en-MY', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        message.reply(`📅 Today is ${today}, Sensei.`);
    }


    //!link
    if (textLower === '!link') {
        message.reply(
    `📎 These are some important links, Sensei:
    • 📄 Github: https://github.com/HirumiSen01
    • 📜 TikTok: https://www.tiktok.com/@unsaltedsalt_
    • 🗓 Instagram: https://www.instagram.com/unsaltedsalt_`
        );
    }


    //!afk command
    if (textLower.startsWith('!afk')) {
        const rawSender = message.author || message.from;
        const senderId = normalizeId(rawSender); // Consistent normalized ID
        console.log("✅ Normalized Sender ID:", senderId);

        const reason = textRaw.slice(4).trim() || "No reason provided, Sensei~";

        afkStatus[senderId] = {
            reason,
            time: Date.now()
        };

        saveAfk();

        message.reply(`🔕 Wakatta Sensei~ You're now AFK: *${reason}*`);
    }


    //!back command
    if (textLower === '!back') {
        const rawSender = message.author || message.from;
        const senderId = normalizeId(rawSender);
        console.log("Normalized Sender ID:", senderId);


        const contact = await message.getContact();
        const id = contact.id._serialized;


        if (afkStatus[id]) {
            delete afkStatus[id];
            saveAfk();
            message.reply("Welcome back, Sensei! I’ve cleared your AFK status.");
        } else {
            message.reply("You're not AFK right now, Sensei~");
        }
    }


    if (message.mentionedIds && message.mentionedIds.length > 0) {
        for (const userId of message.mentionedIds) {
            if (afkStatus[userId]) {
                const reason = afkStatus[userId].reason;
                const duration = Math.floor((Date.now() - afkStatus[userId].time) / 60000); // minutes
                const contact = await client.getContactById(userId);

                message.reply(`🔕 ${contact.pushname || '@' + contact.number} is currently AFK: *${reason}*\n⏱️ AFK for ${duration} minute(s), Sensei~`);
                break; // only mention the first AFK user
            }
        }
    }


    // --- TODO COMMANDS ---
    if (textLower.startsWith('!todo')) {
        const args = textLower.split(' ').slice(1);
        const todos = loadJSON(todoPath);

        if (args[0] === 'list') {
            if (todos.length === 0) return message.reply("📝 No chores in the list, Sensei~");
            const list = todos.map((item, i) => `${i + 1}. ${item}`).join('\n');
            return message.reply("🧹 Current To-Do List:\n" + list);

        } else if (args[0] === 'done') {
            const index = parseInt(args[1]) - 1;
            if (isNaN(index) || index < 0 || index >= todos.length) return message.reply("❌ Invalid number!");
            const removed = todos.splice(index, 1);
            saveJSON(todoPath, todos);
            return message.reply(`✅ Removed: ${removed}`);

        } else {
            const task = args.join(' ');
            if (!task) return message.reply("❗ Usage: !todo [task] / list / done [num]");
            todos.push(task);
            saveJSON(todoPath, todos);
            return message.reply(`🆕 Added to the to-do list: ${task}`);
        }
    }

       
        // --- QUOTES ---
     if (textLower.startsWith('!quote')) {
            const args = textLower.split(' ').slice(1);
            const quotes = loadJSON(quotesPath);

            if (args[0] === 'add') {
                const quote = textLower.split(' ').slice(2).join(' ');
                if (!quote) return message.reply("❗ Usage: !quote add [message]");
                quotes.push(quote);
                saveJSON(quotesPath, quotes);
                return message.reply("💬 Quote added!");

            } else if (args[0] === 'random') {
                if (quotes.length === 0) return message.reply("📭 No quotes stored, Sensei~");
                const rand = quotes[Math.floor(Math.random() * quotes.length)];
                return message.reply(`🧠 Quote: "${rand}"`);

            } else if (args[0] === 'list') {
                const list = quotes.map((q, i) => `${i + 1}. ${q}`).join('\n');
                return message.reply("🗃️ All Quotes:\n" + list);
            } else {
                return message.reply("❗ Usage: !quote add / random / list");
            }
     }

        // --- BILLS ---
       
     if (textLower.startsWith('!bills')) {

          const args = textLower.split(' ').slice(1);
              const bills = loadJSON(billsPath) 
          if (args[0] === 'add') {
               const entry = textLower.split(' ').slice(2).join(' ');
          if (!entry) return message.reply(":exclamation: Usage: !bills add [description and amount]");
               bills.push(entry);
               saveJSON(billsPath, bills);
                  return message.reply(":pushpin: Bill added!");

          } else if (args[0] === 'list') {

        if (bills.length === 0) return message.reply(":mailbox_with_no_mail: No bills listed, Sensei~");
                const list = bills.map((b, i) => `${i + 1}. ${b}`).join('\n');
                return message.reply(":money_with_wings: Current Bills:\n" + list);
             }  else if (args[0] === 'done') {
    
                const index = parseInt(args[1]) - 1;
                 if (isNaN(index) || index < 0 || index >= bills.length) {
                          return message.reply(":x: Invalid number, Sensei~");
                 }
                          const removed = bills.splice(index, 1);
                          const paidBills = loadJSON(billsPaidPath);
                           paidBills.push(removed[0]);
                          saveJSON(billsPaidPath, paidBills);
                          saveJSON(billsPath, bills);
                      return message.reply(`✅ Marked as paid and archived: ${removed}`);
                    } else if (args[0] === 'clear') {
                  bills.length = 0;
                 saveJSON(billsPath, bills);
             return message.reply("🧹 All bills have been cleared, Sensei!");
           } else {
        return message.reply(":exclamation: Usage: !bills add / list / done [num] / clear");
    }
    }

    
        // --- EVENTS ---
     if (textLower.startsWith('!event')) {
            const args = textLower.split(' ').slice(1);
            const events = loadJSON(eventsPath);

            if (args[0] === 'add') {
                const entry = textLower.split(' ').slice(2).join(' ');
                if (!entry) return message.reply("❗ Usage: !event add [description and time]");
                events.push(entry);
                saveJSON(eventsPath, events);
                return message.reply("🗓️ Event added!");
            } else if (args[0] === 'list') {
                if (events.length === 0) return message.reply("📭 No upcoming events, Sensei~");
                const list = events.map((e, i) => `${i + 1}. ${e}`).join('\n');
                return message.reply("📅 Upcoming Events:\n" + list);
            } else {
                return message.reply("❗ Usage: !event add / list");
            }
     }



    //Paid rent commands for multiple members
    if (textLower.startsWith('!rent paid')) {
        const rawArgs = textLower.replace('!rent paid', '').trim();
        
        // Find the first space to separate names from bill
        const firstSpace = rawArgs.indexOf(' ');
        if (firstSpace === -1) {
            return message.reply("⚠ Usage: `!rent paid name1,name2 billname`");
        }

        const namesPart = rawArgs.substring(0, firstSpace).trim();
        const billName = rawArgs.substring(firstSpace + 1).trim();
        const names = namesPart.split(',').map(n => n.trim());

        if (!billName) return message.reply("⚠ Please specify the bill name.");

        const rentData = loadRent();
        const currentMonth = getCurrentMonth();
        ensureMonthExists(rentData);

        let updated = [], skipped = [];

        for (const name of names) {
        if (
            rentData[currentMonth]?.[name]?.[billName] !== undefined
        ) {
            rentData[currentMonth][name][billName] = 'paid';
            updated.push(name);
        } else {
            skipped.push(name);
        }
     }

         saveRent(rentData);

         let replyMsg = "";
         if (updated.length > 0) {
             replyMsg += `✅ Sensei, I've marked them as paid for *${billName}*:\n• ${updated.join('\n• ')}`;
         }
         if (skipped.length > 0) {
             replyMsg += `\n⚠ Not found or bill missing:\n• ${skipped.join('\n• ')}`;
         }
     
         return message.reply(replyMsg.trim());
    }


    //Adding members to the rent
    if (textLower.startsWith('!rent addmember')) {
         const rentData = Rent.loadRent();
         const currentMonth = Rent.ensureMonthExists(rentData);

         // 🔧 FIX: You forgot to define 'name'
         const name = textLower.split(' ').slice(2).join(' ').trim();

         if (!name) {
             return message.reply("❗ Usage: !rent addmember [name]");
         }

         if (rentData[currentMonth][name]) {
             return message.reply(`📝 ${name} is already listed for ${currentMonth}, Sensei~`);
         }

         rentData[currentMonth][name] = {
             electricity: "unpaid"
         };
         Rent.saveRent(rentData);

         return message.reply(`📌 Added ${name} to the rent tracker for ${currentMonth}, Sensei!`);

        }


    //listing the rent 
    if (textLower.startsWith('!rent list')) {
        const args = textLower.trim().split(' ');
        const mode = args[2] === 'bill' ? 'bill' : 'member';

        const rentData = Rent.loadRent();
        const currentMonth = Rent.ensureMonthExists(rentData);
        const members = rentData[currentMonth];

        if (!members || Object.keys(members).length === 0) {
            return message.reply(`📭 No members listed for ${currentMonth}, Sensei~`);
        }

        const lines = [`📊 *Rent Status – ${currentMonth}* (${mode === 'bill' ? 'by Bill' : 'by Member'})`];
        let totalBills = 0;
        let paidCount = 0;
        let unpaidMentions = [];

        if (mode === 'member') {
            for (const member of Object.keys(members).sort()) {
                const bills = members[member];
                lines.push(`\n🔹 *${member}*`);

                const sortedBills = Object.entries(bills).sort(([, a], [, b]) => a === 'paid' ? -1 : 1);
                

                for (const [bill, status] of sortedBills) {
                    const emoji = status === 'paid' ? '✅' : '❌';
                    lines.push(`   • ${bill}: ${emoji} ${status}`);
                    totalBills++;
                    if (status === 'paid') paidCount++;
                    else unpaidMentions.push(member);
                }
            }

        } else {
            const billGroups = {};
            for (const [member, bills] of Object.entries(members)) {
                for (const [bill, status] of Object.entries(bills)) {
                    if (!billGroups[bill]) billGroups[bill] = [];
                    billGroups[bill].push({ member, status });
                }
            }

            for (const [bill, entries] of Object.entries(billGroups)) {
                lines.push(`\n📌 *${bill.toUpperCase()}*`);

                const sortedEntries = entries.sort((a, b) => a.status === 'paid' ? -1 : 1);
                for (const { member, status } of sortedEntries) {
                    const emoji = status === 'paid' ? '✅' : '❌';
                    lines.push(`• ${member}: ${emoji} ${status}`);
                    totalBills++;
                    if (status === 'paid') paidCount++;
                    else unpaidMentions.push(member);
                }
            }
        }

        const unpaidCount = totalBills - paidCount;
        const percentPaid = totalBills > 0 ? (paidCount / totalBills) : 0;
        const chart = generateBarChart(percentPaid);

        lines.push(`\n📦 *Summary*`);
        lines.push(`• Total Bills: ${totalBills}`);
        lines.push(`• ✅ Paid: ${paidCount}`);
        lines.push(`• ❌ Unpaid: ${unpaidCount}`);
        lines.push(`• Progress: ${chart} ${Math.round(percentPaid * 100)}%`);

        // 🔔 Ping unpaid users (if found in chat)
        const chat = await message.getChat();
        const mentions = [];

        for (const contact of chat.participants) {
            const contactName = contact.name?.toLowerCase() || contact.pushname?.toLowerCase() || '';
            for (const unpaid of unpaidMentions) {
                if (contactName.includes(unpaid.toLowerCase()) && !mentions.includes(contact.id._serialized)) {
                    mentions.push(contact.id._serialized);
                }
            }
        }

        return message.reply(lines.join('\n'), undefined, {
            mentions
        });
         }


    //adding bills to the rent 
    if (textLower.startsWith('!rent addbill')) {
         const billName = textRaw.slice('!rent addbill'.length).trim().toLowerCase();
         if (!billName) return message.reply("❗ Usage: !rent addbill [bill name]");

         const rentData = loadRent();
         const currentMonth = getCurrentMonth();
         ensureMonthExists(rentData);

         const monthData = rentData[currentMonth];

         for (const member in monthData) {
             // 🛡 FIX 1: If entry is missing or broken, reinitialize it
             if (!monthData[member] || typeof monthData[member] !== 'object') {
                 monthData[member] = {};
             }

             // 🛡 FIX 2: Only add if the bill doesn’t already exist
             if (!Object.prototype.hasOwnProperty.call(monthData[member], billName)) {
                 monthData[member][billName] = "unpaid";
             }
         }

         saveRent(rentData);
         return message.reply(`✅ New bill "${billName}" added to all members in ${currentMonth}, Sensei~`);
         }


    //Individual rent paid
    if (textLower.startsWith('!rent paid')) {
        const parts = textRaw.split(' '); // Use raw to preserve original positions
           const name = parts[2].toLowerCase(); // normalize casing
           const billName = parts.slice(3).join(' ').toLowerCase(); // e.g. "wifi"

    // "wifi"
        console.log("RAW:", textRaw);
           console.log("NAME:", name);
           console.log("BILL:", billName);


       console.log(">>> name:", name);
       console.log(">>> billName:", billName);

       const members = rentData[currentMonth];
       if (!members) {
           return message.reply(`❌ No data found for ${currentMonth}, Sensei.`);
       }

       if (!(name in members)) {
           return message.reply(`❌ '${name}' not found in ${currentMonth}, Sensei.`);
       }

       const userBills = members[name];
       if (typeof userBills !== 'object') {
           return message.reply(`⚠ ${name}'s data looks corrupted, Sensei.`);
       }

       console.log(">>> Available bills:", Object.keys(userBills));

       if (!(billName in userBills)) {
           return message.reply(`❌ '${billName}' is not listed for ${name}, Sensei.`);
       }

       userBills[billName] = "paid";
       Rent.saveRent(rentData);

       return message.reply(`✅ Marked '${billName}' as paid for ${name} in ${currentMonth}, Sensei!`);
    }


    //Setting Up Next Month's Bill
    if (textLower.startsWith('!rent nextmonth')) {
       const rentData = Rent.loadRent();
       const currentMonth = Rent.ensureMonthExists(rentData);

       // Get month name like "July 2025"
       const now = new Date();
       const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
       const monthNames = [
           "January", "February", "March", "April", "May", "June",
           "July", "August", "September", "October", "November", "December"
       ];
       const nextMonth = `${monthNames[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`;

       if (rentData[nextMonth]) {
           return message.reply(`⚠ ${nextMonth} already exists, Sensei~`);
        }

        const newMonth = {};

        for (const [member, bills] of Object.entries(rentData[currentMonth])) {
            newMonth[member] = {};
            for (const bill of Object.keys(bills)) {
                newMonth[member][bill] = "unpaid";
            }
            if (typeof bills !== "object") {
            lines.push(`   ⚠ Data corrupted for ${member}, Sensei~`);
             continue;
            }

        }

        rentData[nextMonth] = newMonth;
        Rent.saveRent(rentData);

        return message.reply(`📦 Sensei, I initialized ${nextMonth} with all members and bills set to unpaid!`);
    }


    //!rent summary
    if (textLower === '!rent summary') {
         const rentData = Rent.loadRent();
         const currentMonth = Rent.ensureMonthExists(rentData);

         const monthData = rentData[currentMonth];
         if (!monthData || Object.keys(monthData).length === 0) {
             return message.reply(`📭 No members listed for ${currentMonth}, Sensei~`);
         }

         const billStats = {};

         // 🧮 Tally bills
         for (const [member, bills] of Object.entries(monthData)) {
             for (const [bill, status] of Object.entries(bills)) {
                 if (!billStats[bill]) {
                     billStats[bill] = { paid: [], unpaid: [] };
                 }
                 billStats[bill][status === 'paid' ? 'paid' : 'unpaid'].push(member);
             }
         }

         let lines = [`📦 Rent Summary – ${currentMonth}`];

         for (const [bill, { paid, unpaid }] of Object.entries(billStats)) {
             const paidBar = '✅'.repeat(paid.length);
             const unpaidBar = '❌'.repeat(unpaid.length);

             lines.push(
                 `\n${getBillEmoji(bill)} ${bill}`,
                 `✅ Paid: ${paid.length} / ${paid.length + unpaid.length}`,
                 `❌ Unpaid: ${unpaid.length}`,
                 unpaid.length > 0 ? `• ${unpaid.join(', ')}` : `• All paid, Sensei!`
             );
         }

         return message.reply(lines.join('\n'));
    }


    // 🔧 Optional: emoji for each bill type
    function getBillEmoji(bill) {
        const map = {
            electricity: '💡',
            wifi: '📶',
            water: '🚿',
            gas: '🔥',
            rent: '🏠',
            others: '📎'
        };
        return map[bill.toLowerCase()] || '🧾';
    }


    //!rent unpaid status for multiple bills and members
    if (message.body.startsWith("!rent unpaid")) {
        const args = message.body.replace("!rent unpaid", "").trim();
        if (!args) return message.reply("Ehh? Siapa belum bayar apa tu, Sensei? Cuba check balik..");

            const rentData = Rent.loadRent();
            const currentMonth = Rent.ensureMonthExists(rentData);
            const monthData = rentData[currentMonth];

            const parts = args.split(" ");
            const knownBills = ["electricity", "water", "wifi"];

            const names = [];
            const bills = [];

            for (const part of parts) {
              const billKey = part.toLowerCase();
              if (knownBills.includes(billKey)) {
                bills.push(billKey);
              } else if (monthData[part.toLowerCase()]) {
                names.push(part.toLowerCase());
              }
            }
    
            const updated = [];
            const skipped = [];
    
        for (const name of names) {
          for (const bill of bills) {
            if (monthData?.[name]?.[bill] !== undefined) {
              monthData[name][bill] = "unpaid";
              updated.push(RentAI.formatName(name));
            } else {
              skipped.push(RentAI.formatName(name));
            }
          }
  }

  Rent.saveRent(rentData);

  if (updated.length > 0) {
    const billList = bills.join(", ");
    const userList = [...new Set(updated)].join(", ");
    return message.reply(`💬 Arisu dah set status *unpaid* untuk *${billList}*:\n• ${userList}, noted Sensei~ ✅`);
  } else {
    return message.reply(`Arisu tak jumpa nama atau bill tu:\n• ${[...new Set(skipped)].join(", ")} 🤔`);
  }
    }


    //!export command
    if (textLower === '!export') {
      if (!(await isAdmin(message))) {
        return message.reply("⛔ Access denied. Admins only, Sensei.");
      }

      const exportPath = path.join(__dirname, 'data', 'rent-export.json');

      try {
        const data = loadRent();
        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf-8');

        const media = MessageMedia.fromFilePath(exportPath);
        await message.reply(media);
        fs.unlinkSync(exportPath); // ✨ Delete the file after sending

        console.log("[EXPORT] File sent and cleaned up, Sensei!");
      } catch (err) {
        console.error("❌ Export failed:", err);
        message.reply("⚠ Arisu couldn’t complete the export quest...");
      }
    }


    if (textLower.startsWith('!rent status')) {
    const args = textRaw.trim().split(' ');
    const billName = args.slice(2).join(' ').toLowerCase();

    if (!billName) {
        return message.reply("❗ Usage: !rent status [bill name], Sensei~");
    }

    const rentData = Rent.loadRent();
    const currentMonth = Rent.ensureMonthExists(rentData);

    const members = rentData[currentMonth];
    if (!members) {
        return message.reply(`📭 No data found for ${currentMonth}, Sensei.`);
    }

    const paid = [];
    const unpaid = [];

    for (const [member, bills] of Object.entries(members)) {
        if (bills && typeof bills === 'object') {
            const status = bills[billName];
            if (status === 'paid') {
                paid.push(member);
            } else if (status === 'unpaid') {
                unpaid.push(member);
            }
        }
    }

    if (paid.length === 0 && unpaid.length === 0) {
        return message.reply(`⚠ The bill "*${billName}*" isn’t listed for anyone in ${currentMonth}, Sensei.`);
    }

    let reply = `📊 *Rent Status for ${currentMonth} – ${billName}*\n`;

    if (paid.length > 0) {
        reply += `\n✅ *Paid:*\n• ${paid.join('\n• ')}`;
    }

    if (unpaid.length > 0) {
        reply += `\n\n❌ *Unpaid:*\n• ${unpaid.join('\n• ')}`;
    }

    return message.reply(reply);
    }


    //Remove member for the bill/month
    if (textLower.startsWith('!rent remove')) {
        const args = textRaw.split(' ').slice(2); // Preserve original spacing
        if (args.length === 0) {
            return message.reply("❗ Usage:\n• `!rent remove [name]`\n• `!rent remove [name] [bill]`\n• `!rent remove [name] [bill] [Month YYYY]`");
        }

        const name = args[0]?.toLowerCase();
        const billName = args[1]?.toLowerCase();
        const specifiedMonth = args.slice(2).join(' '); // Month is optional

        const rentData = Rent.loadRent();
        const month = specifiedMonth || Rent.getCurrentMonth();
        Rent.ensureMonthExists(rentData, month);

        if (!rentData[month]?.[name]) {
            return message.reply(`❌ Member '${name}' not found in ${month}, Sensei.`);
        }

        if (billName) {
            if (rentData[month][name][billName] !== undefined) {
                delete rentData[month][name][billName];

                // Remove member if now empty
                if (Object.keys(rentData[month][name]).length === 0) {
                    delete rentData[month][name];
                    Rent.saveRent(rentData);
                    return message.reply(`🗑 Removed '${billName}' bill from ${name}, and removed ${name} completely (no bills left), Sensei~`);
                }

                Rent.saveRent(rentData);
                return message.reply(`🧻 Removed '${billName}' from ${name} for ${month}, Sensei!`);
            } else {
                return message.reply(`❌ '${billName}' not found for ${name} in ${month}, Sensei.`);
            }
        }

        // No bill = delete full member
        delete rentData[month][name];
        Rent.saveRent(rentData);
        return message.reply(`🗑 Removed ${name} from ${month}, Sensei!`);
    }


    //Removes bill from the month
    if (textLower.startsWith('!rent removebill')) {
    const args = textRaw.split(' ').slice(2);
    const billName = args[0]?.toLowerCase();
    const monthArg = args.slice(1).join(' ');
    
    if (!billName) {
        return message.reply("❗ Usage:\n• `!rent removebill [bill name]`\n• `!rent removebill [bill name] [Month YYYY]`");
    }

    const rentData = Rent.loadRent();
    const targetMonth = monthArg || Rent.getCurrentMonth();
    Rent.ensureMonthExists(rentData, targetMonth);

    const monthData = rentData[targetMonth];
    if (!monthData) {
        return message.reply(`❌ No data found for ${targetMonth}, Sensei.`);
    }

    let removedFrom = [];
    for (const [member, bills] of Object.entries(monthData)) {
        if (bills[billName] !== undefined) {
            delete bills[billName];
            removedFrom.push(member);

            // If member now has no bills, remove member
            if (Object.keys(bills).length === 0) {
                delete monthData[member];
            }
        }
    }

    Rent.saveRent(rentData);

    if (removedFrom.length === 0) {
        return message.reply(`⚠ No member had the bill '${billName}' in ${targetMonth}, Sensei.`);
    }

    return message.reply(`🧹 Removed '${billName}' from:\n• ${removedFrom.join('\n• ')}\n📅 Month: ${targetMonth}`);
    }


    //importing rent data
    if (textLower === '!import') {
    if (!(await isAdmin(message))) {
        return message.reply("⛔ Access denied. Admins only, Sensei.");
    }

    const quoted = message.hasQuotedMsg ? await message.getQuotedMessage() : null;

    if (!quoted || quoted.type !== 'document') {
        return message.reply("⚠ Please reply to a valid `.json` file to import!");
    }

    const buffer = await quoted.downloadMedia();

    if (!buffer || !buffer.data) {
        return message.reply("❌ Arisu couldn’t read the file... Maybe it's corrupted?");
    }

    try {
        const jsonText = Buffer.from(buffer.data, 'base64').toString('utf-8');
        const parsed = JSON.parse(jsonText);

        // If it’s not an object or missing required fields
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return message.reply("⚠ That doesn’t look like a valid `.json`, Sensei...");
        }

        fs.writeFileSync(rentPath, JSON.stringify(parsed, null, 2));
        console.log(`[IMPORT] Rent data imported successfully by ${message.from}`);
        return message.reply("✅ Rent data successfully updated Sensei!");
    } catch (err) {
        console.error("❌ Import failed:", err);
        return message.reply("⚠ Failed to import. Is the file formatted correctly?");
    }
    }


    //Rent summary with emojis (chart.. etc..)
    if (textLower.startsWith('!rent emoji')) {
    const args = textRaw.split(' ').slice(3);
    const targetMonth = args.join(' ') || Rent.getCurrentMonth();

    const rentData = Rent.loadRent();
    Rent.ensureMonthExists(rentData, targetMonth);

    const monthData = rentData[targetMonth];
    if (!monthData) {
        return message.reply(`📭 No data found for ${targetMonth}, Sensei.`);
    }

    let paidCount = 0;
    let unpaidCount = 0;

    for (const bills of Object.values(monthData)) {
        for (const status of Object.values(bills)) {
            if (status === 'paid') paidCount++;
            else unpaidCount++;
        }
    }

    const total = paidCount + unpaidCount;

    // Generate emoji bars (max 10 blocks for each)
    const maxBarLength = 10;
    const paidBar = '█'.repeat(Math.round((paidCount / total) * maxBarLength));
    const unpaidBar = '█'.repeat(Math.round((unpaidCount / total) * maxBarLength));

    const lines = [
        `📅 *${targetMonth} – Rent Status Overview*`,
        `✅ Paid: ${paidBar || '–'} ${paidCount}`,
        `❌ Unpaid: ${unpaidBar || '–'} ${unpaidCount}`
    ];

    return message.reply(lines.join('\n'));
    }


    ///////////////////////////////////////////////////////////////
 ///Rent-AI Arisu Integration////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////

    const billEmojis = {
      water: "💧",
      electricity: "🔌",
      wifi: "📶",
      rent: "🏠",
      sewa: "🏠", // just in case
    };

    const rentAIResult = RentAI.parse(textRaw);
    console.log("[RENT-AI] Parsed result:", rentAIResult);

    
    // rent paid, unpaid with AI integration
    if (rentAIResult && (rentAIResult.intent === "paid" || rentAIResult.intent === "unpaid")) {
      const rentData = Rent.loadRent();
      const currentMonth = Rent.ensureMonthExists(rentData);
      const monthData = rentData[currentMonth];
         
      // If "ALL_MEMBERS" was parsed (from "semua"), replace it with real names
      if (rentAIResult.names.includes("ALL_MEMBERS")) {
        rentAIResult.names = Object.keys(monthData || {});
        await message.reply("Hehe~ Arisu will handle *everyone* for you, Sensei! 🫡💙✨");
      }
     
      const updated = [];
      const skipped = [];
     
      for (const name of rentAIResult.names) {
        for (const bill of rentAIResult.bills) {
          if (monthData?.[name]?.[bill] !== undefined) {
            monthData[name][bill] = rentAIResult.intent; // paid or unpaid
           updated.push(RentAI.formatName(name));
         } else {
           skipped.push(RentAI.formatName(name));
         }
       }
  }

  Rent.saveRent(rentData);

  if (updated.length > 0) {
    const billList = rentAIResult.bills.map(b => b.toUpperCase()).join(", ");
    const userList = [...new Set(updated)].join(", ");

    let response = "";
    if (rentAIResult.intent === "paid") {
      response = `Hai Hai~! Arisu dah update status *${billList}* untuk:\n• ${userList}, Sensei~ ✨ Anything else nak update?`;
    } else {
      response = `Yossha~ Noted! ✅ Arisu dh set status *UNPAID* untuk *${billList}*:\n• ${userList}, jangan risau Sensei~!`;
    }

    return message.reply(response);
  } else {
    return message.reply(`Ehh? Arisu tak jumpa nama atau bill tu laa, Sensei:\n• ${[...new Set(skipped)].join(", ")} Cuba sensei check balik? 🥺`);
  }
    }



    // Displays member list in the current rent
    if (rentAIResult && rentAIResult.intent === "list_members") {
     const rentData = Rent.loadRent();
     const currentMonth = Rent.ensureMonthExists(rentData);
     const members = rentData[currentMonth];

     if (!members || Object.keys(members).length === 0) {
       return message.reply(`📭 Ehh? I don’t see anyone in the rent list for *${currentMonth}*, Sensei...`);
     }

     const lines = [`👥 *Rent Members – ${currentMonth}*`];
     for (const name of Object.keys(members).sort()) {
       lines.push(`• ${RentAI.formatName(name)}`);
     }

     return message.reply(`${lines.join("\n")}\n\nAll accounted for! Let me know if we’re missing someone~ 💫`);
    }


    // Displays bill list in the current rent
    if (rentAIResult && rentAIResult.intent === "list_bills") {
     const rentData = Rent.loadRent();
     const currentMonth = Rent.ensureMonthExists(rentData);
     const members = rentData[currentMonth];

     if (!members || Object.keys(members).length === 0) {
       return message.reply(`📭 Hmm... no members found for *${currentMonth}*, Sensei~`);
     }

     const billSet = new Set();
     for (const bills of Object.values(members)) {
       Object.keys(bills).forEach(b => billSet.add(b));
     }

     if (billSet.size === 0) {
       return message.reply(`💬 Looks like no bills have been added yet for *${currentMonth}*. Wanna set them up?`);
     }

     const bills = Array.from(billSet).sort().map(b => `• ${b}`);
     return message.reply(`💸 *Bill List – ${currentMonth}*\n${bills.join("\n")}\n\nAll clear! I can check who paid what anytime~ 💕`);
    }


    // Displays rent list per bill
    if (rentAIResult && rentAIResult.intent === "status_bill") {
        const billsToCheck = rentAIResult.bills;
        const rentData = Rent.loadRent();
        const currentMonth = Rent.ensureMonthExists(rentData);
        const members = rentData[currentMonth];

        const billSummaryIntros = [
          "Hai Haii~ Arisu found the status for that bill! 📡",
          "On it~ Here's the bill summary, Sensei~! 💙",
          "Beep boop~ Status for that bill coming right up~ ✨",
          "Hehe~ Let’s see who’s paid and who hasn’t~ 🧾💰"
        ];

        const billSummaryOutros = [
          "Let me know if you want to check another one! 📩",
          "All done, Sensei~! Let’s make sure everyone’s covered! 💪",
          "Hope that helps~ Arisu ready for the next task~! ✨",
          "Any other bills to peek at? Arisu’s standing by~ 🎵"
        ];


        if (!members || Object.keys(members).length === 0) {
          return message.reply(`Uwaa~ Arisu tak nampak sesiapa pun yang menyewa untuk bulan *${currentMonth}*, Sensei! 😰`);
        }

        let reply = `📑 *Bill Status for ${currentMonth}*\n${pickRandom(billSummaryIntros)}\n\n`;

        for (const bill of billsToCheck) {
            const emoji = billEmojis[bill] || "📄"; // fallback emoji
          reply += `${emoji} *${bill.toUpperCase()}*\n`;
          for (const [name, bills] of Object.entries(members)) {
            const status = bills[bill] === "paid" ? "✅" : "❌";
            reply += `• ${RentAI.formatName(name)} – ${status}\n`;
          }
          reply += "\n";
        }

        reply += pickRandom(billSummaryOutros);

        return message.reply(reply.trim());
    }


    
    // Displays the rent member status
    
    if (rentAIResult && rentAIResult.intent === "status_permember") {
      const rentData = Rent.loadRent();
      const currentMonth = Rent.ensureMonthExists(rentData);
      const members = rentData[currentMonth];
    
      if (!members || Object.keys(members).length === 0) {
        return message.reply(`Uwaa~ Arisu tak jumpa sesiapa pun untuk *${currentMonth}*, Sensei! 🥺
    Let’s double check if everything’s okay, okay~? 💭`);
      }
  
      // Randomized intro & outro ✨
      const intros = [
        `📋 *Rental Summary – ${currentMonth}*\nArisu dah kira semua untuk Sensei~! 💙\n`,
        `✨ Here’s your rent status for *${currentMonth}*, hot and fresh! 🍱📑\n`,
        `📦 Tadaa~ Rent report for *${currentMonth}* is here! Let’s take a look~!\n`,
        `🧾 Arisu found everyone's status for *${currentMonth}*, Sensei~!\n`,
      ];
  
      const outros = [
        `Hehe~ That’s everyone for *${currentMonth}*! Arisu's cheering for all of you! 📣💪`,
        `Semua dah Arisu semak~ Let me know if anything looks off, Sensei! 💻✨`,
        `Kalau nak Arisu update apa-apa, just tell me okay~? 🛠💙`,
        `Yosh~ That’s the report! Nak tengok by bill pula ke? 📊`,
      ];
  
     
  
      let response = pickRandom(intros) + "\n";
  
      for (const [member, bills] of Object.entries(members)) {
        response += `👤 *${RentAI.formatName(member)}*\n`;
        for (const bill in bills) {
        const emoji = billEmojis[bill] || "📄"; // fallback emoji
          const status = bills[bill] === "paid" ? "✅ Paid" : "❌ Unpaid";
          response += `•${emoji} ${bill.toUpperCase()} – ${status}\n`;
        }
        response += "\n";
      }
  
      response += pickRandom(outros);
  
      return message.reply(response.trim());
    }






    // FUN commands ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //!mal [anime]
    if (textLower.startsWith('!mal ')) {
    const query = textLower.slice(5).trim();
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;

    axios.get(url)
        .then(response => {
            const anime = response.data.data[0];
            if (!anime) {
                message.reply("Anime not found, Sensei.");
            } else {
                message.reply(
`🎬 ${anime.title} (${anime.score ?? 'N/A'}⭐)
📺 Status: ${anime.status} | Episodes: ${anime.episodes}
🏷 Genres: ${anime.genres.map(g => g.name).join(', ')}
🔗 MAL: ${anime.url}`
                );
            }
        })
        .catch(() => {
            message.reply("Failed to fetch anime info, Sensei.");
        });
    }


    //!quoteanime
    if (textLower === '!quoteanime') {
    const quotes = [
        `"A lesson without pain is meaningless." – Edward Elric, FMA: Brotherhood`,
        `"Power comes in response to a need, not a desire." – Goku, DBZ`,
        `"Forgetting is like a wound. The wound may heal, but it has already left a scar." – Monkey D. Luffy`,
        `"People’s lives don’t end when they die, it ends when they lose faith." – Itachi Uchiha`
    ];
    const chosen = quotes[Math.floor(Math.random()  *quotes.length)];
    message.reply(chosen);
    }


    //!waifu
    if (textLower.startsWith('!waifu')) {
    const args = textLower.trim().split(' ');
    const mode = args[1] === 'nsfw' ? 'nsfw' : 'sfw';

    // Optional group safety check
    if (mode === 'nsfw' && message.from.includes('-')) {
        message.reply("Nyaa~ naughty waifus are only allowed in private, Sensei! 😳");
        return;
    }

    axios.get(`https://api.waifu.pics/${mode}/waifu`)
        .then(async res => {
            const media = await MessageMedia.fromUrl(res.data.url, {
                unsafeMime: true
            });

            //  Step 1: Send "thinking..." reply
            const loadingMsg = isNyaaMode
                ? uwuify("Arisu is thinking nya~... 🔍💭")
                : "Arisu is thinking, Sensei~ 🔍💭";

            message.reply(loadingMsg);

            //  Step 2: Wait before sending media
            setTimeout(() => {
                const finalReply = isNyaaMode
                    ? uwuify(`Here's youw ${mode.toUpperCase()} waifu, Sensei~ !`)
                    : `Here's your ${mode.toUpperCase()} waifu, Sensei~ !`;

                message.reply(finalReply);
                client.sendMessage(message.from, media);
            }, 2500); // 2.5 seconds delay
        })
        .catch(() => {
            message.reply("Gomen Sensei~ Arisu couldn't find a waifu right now >w<");
        });
    }


    //gacha 
    if (textLower === '!gacha') {
    const results = [
        '★★★★★ – Hoshino Ichika (Project Sekai)',
        '★★★★ – Power (Chainsaw Man)',
        '★★★ – Subaru (Re:Zero)',
        '★★★★★ – Gojo Satoru (Jujutsu Kaisen)',
        '★★★★ – Lumine (Genshin Impact)',
        '★★ – Yamcha (ouch.)'
    ];
    const roll = results[Math.floor(Math.random() * results.length)];
    message.reply(`🎉 You rolled: ${roll}`);
    }


    //!nyaa
    if (textLower === '!nyaa') {
    isNyaaMode = !isNyaaMode;

    const reply = isNyaaMode
        ? "Nyaa-mode activated~! Arisu is now your fluffy catgirl assistant nya~ "
        : "Nyaa-mode deactivated. Back to normal operation, Sensei~";

    message.reply(reply);
    }


    //reaction commands
    for (const [cmd, action] of Object.entries(reactions)) {
    if (textLower.startsWith(`!${cmd}`)) {
        animeReactionCommand(message, textLower, `!${cmd}`, cmd, action, isNyaaMode, uwuify, client);
    }
    }


    // --- ROLL ---
    if (textLower.startsWith('!roll')) {
            const roll = Math.floor(Math.random() * 6) + 1;
            return message.reply(`🎲 You rolled a ${roll}, Sensei!`);
    }


    if (textLower === '!cat') {
         try {
        // Simulate typing and delay
        const chat = await message.getChat();
        client.sendPresenceAvailable();
        chat.sendStateTyping();

        await new Promise(resolve => setTimeout(resolve, 1500));

        await message.reply('🐾 Arisu is rummaging through her cat folder, please wait~');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch image from Cataas
        const response = await axios.get('https://cataas.com/cat', {
            responseType: 'arraybuffer'
        });

        const media = new MessageMedia('image/jpeg', response.data.toString('base64'), 'cat.jpg');
        await message.reply(media, undefined, {
            caption: 'Nyaa~ Here’s a cat for you, Sensei! 🐱'
        });

    } catch (error) {
        console.error('Failed to fetch cat:', error.message);
        message.reply('😿 Arisu couldn’t find a cat right now, Sensei...');
    }
    }


    // Image to Sticker
    if (message.body.toLowerCase().startsWith("!sticker") && message.hasQuotedMsg) {
     const quoted = await message.getQuotedMessage();

      if (!quoted.hasMedia) {
        const failReply = [
          "Uwaa~ there's no image for Arisu to sticker-fy! Can you reply directly to a photo, Sensei? 🖼",
          "Ehh? I can't see any media there~ Try again by replying to the image, okay? 💭",
          "S-Sensei, no image detected! Arisu needs a photo to sparkle into a sticker~ ✨"
        ];
        return message.reply(failReply[Math.floor(Math.random() * failReply.length)]);
      }

      const media = await quoted.downloadMedia();

      try {
        const stickerBuffer = await convertToWebpSticker(media);
        const stickerMedia = new MessageMedia("image/webp", stickerBuffer.toString("base64"));

        await client.sendMessage(message.from, stickerMedia, {
          sendMediaAsSticker: true,
          stickerAuthor: "RuumiDev",
          stickerName: "Arisu-bot",
        });

        const successReply = [
          "Tadaa~ Sticker's ready, Sensei! ✨ Arisu magic~ 💫",
          "All done! Here's your shiny new sticker! 🌟",
          "Yosh! Your image has leveled up into a sticker~ Henshin~! 🪄"
        ];
        return message.reply(successReply[Math.floor(Math.random() * successReply.length)]);
      } catch (err) {
        console.error("Sticker conversion error:", err);
        const errorReply = [
          "Aduhh... Arisu couldn't transform that one... Maybe try a different image? 😢",
          "Whoopsie~ Something went wrong! Mind sending another picture? 🛠",
          "That one didn’t go as planned… Let’s retry with a new photo, okay? 📷"
        ];
        return message.reply(errorReply[Math.floor(Math.random() * errorReply.length)]);
      }
    }


    // Arisu’s ✨ sticker-to-image ✨ feature
    if (message.body.toLowerCase().startsWith("!unsticker") && message.hasQuotedMsg) {
    const quoted = await message.getQuotedMessage();

    if (!quoted.hasMedia || quoted.type !== "sticker") {
      return message.reply("Ehh~ That doesn’t look like a sticker to me, Sensei! 🌸 Try replying to a real one, kay~?");
    }

    try {
      const media = await quoted.downloadMedia();
      const webpBuffer = Buffer.from(media.data, "base64");

      const pngBuffer = await sharp(webpBuffer)
        .resize({ width: 512 }) // optional, keep stickers compact
        .png()
        .toBuffer();

      const image = new MessageMedia("image/png", pngBuffer.toString("base64"));

      const responses = [
        "Tadaa~! Your sticker is now a pic, Sensei! 📸✨",
        "Hehe~ All done! Here's your converted sticker 🎀",
        "Here you go! Arisu did her magic~ 💫",
        "Yatta~! Back to image mode~ Let me know if you need more! 💌",
      ];

      const randomCaption = responses[Math.floor(Math.random() * responses.length)];

      await client.sendMessage(message.from, image, { caption: randomCaption });
    } catch (err) {
      console.error("🔴 Arisu failed to convert sticker:", err);
      return message.reply("Uwaa~ Something went wrong! Maybe try again with a different sticker? 🛠");
    }
    }



    // Admin-only commands /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //!setwelcome
    if (textLower.startsWith('!setwelcome')) {

        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }


        console.log('✅ !setwelcome command triggered');

        const chat = await message.getChat();
        const chatId = chat.id._serialized;

        const newMessage = message.body.replace(/!setwelcome/i, '').trim();

        if (!newMessage) {
            return message.reply("⚠ Usage: !setwelcome [your message here]");
        }

        const welcomeData = loadJSON('./data/welcome.json');

        if (!welcomeData[chatId]) {
            welcomeData[chatId] = {};
        }

        welcomeData[chatId].welcome = newMessage;

        console.log('✅ Writing to JSON:', welcomeData);

        saveJSON('./data/welcome.json', welcomeData);

        return message.reply("✅ Welcome message updated successfully!");

    }


    //!setgoodbye
    if (textLower.startsWith('!setgoodbye')) {

   
        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }


        const chat = await message.getChat();
        const chatId = chat.id._serialized;

        const newMessage = textLower.replace('!setgoodbye', '').trim();

        if (!newMessage) {
            return message.reply("⚠ Usage: !setgoodbye [your message here]");
        }

        const welcomeData = loadJSON('./data/welcome.json'); // ✅ now points to correct location

        // Preserve existing welcome message if present
        if (!welcomeData[chatId]) {
            welcomeData[chatId] = {};
        }

        welcomeData[chatId].goodbye = newMessage;

        saveJSON('./data/welcome.json', welcomeData); // ✅ same updated path

        return message.reply("✅ Goodbye message updated successfully!");
    }


    //!testwelcome command
    if (textLower.startsWith('!testwelcome')) {

        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }


        if (!isAdmin(message)) {
            message.reply("Beep !!! Access denied. Admin clearance required.");
        }
        try {
            const chat = await message.getChat();
            const id = chat.id._serialized;
            if (!chat.isGroup) return message.reply("Only works in groups, Sensei~");

            const mentioned = message.mentionedIds?.[0];
            const target = mentioned || message.author || message.from;
            const mention = `@${target.split('@')[0]}`;

            const template = welcomeMessages[id]?.welcome;
            const messageText = template
                ? template.replace(/@user/g, mention)
                : `🎉 Welcome, ${mention}! Arisu is at your service~ (Test Mode)`;

            const contactToMention = mentioned ? { id: mentioned } : await message.getContact();

            await chat.sendMessage(messageText, {
                mentions: [contactToMention]
            });

            console.log(`[TEST WELCOME] Triggered for: ${mention}`);
        } catch (err) {
            console.error("❌ Error in !testwelcome:", err.message);
            message.reply("Arisu ran into a glitch testing welcome, Sensei~ 💦");
        }
    }


    //!testgoodbye command
    if (textLower.startsWith('!testgoodbye')) {
   
        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }

        try {
            const chat = await message.getChat();
            const id = chat.id._serialized;

            if (!chat.isGroup) {
                return message.reply("This command only works in groups, Sensei~");
            }

            const mentioned = message.mentionedIds?.[0];
            const target = mentioned || message.author || message.from;
            const mention = target.includes("@") ? `@${target.split('@')[0]}` : "@user";

            //  Use goodbye, not welcome
            const template = welcomeMessages[id]?.goodbye;

            const messageText = template
                ? template.replace(/@user/g, mention)
                : `👋 Goodbye, ${mention}. Until next time~ (Test Mode)`;

            const contactToMention = mentioned
                ? { id: mentioned }
                : await message.getContact();

            await chat.sendMessage(messageText, {
                mentions: [contactToMention]
            });

            console.log(`[TEST GOODBYE] Simulated goodbye for: ${mention}`);
        } catch (err) {
            console.error("❌ Error in !testgoodbye:", err.message);
            message.reply("Arisu encountered an error simulating goodbye, Sensei~ 💦");
        }
    }


    //!shutdown
    if (textLower === '!shutdown') {

        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }

        const confirmation = await message.reply("Sensei.. are you sure you want to shut down Arisu? Type 'yes' to confirm.");

        // Set up a listener
        const shutdownHandler = async (msg) => {
          if (
            msg.from === message.from &&
            msg.body.toLowerCase().trim() === 'yes'
          ) {
            await msg.reply("Understood, Sensei. Shutting down...");
            console.log("Arisu system is shutting down by admin command.");
            process.exit();
          }
        };

        // Timeout after 30 seconds
        const shutdownTimeout = setTimeout(() => {
          message.reply("⏳ Shutdown cancelled. No response within 30 seconds.");
          client.removeListener('message', shutdownHandler);
        }, 30000);

        // Attach temporary listener
        client.on('message', shutdownHandler);

    }


    //!restart
    if (textLower === '!restart') {
    
    if (!(await isAdmin(message))) {
      return message.reply("⛔ Access denied. Admins only, Sensei.");
    }
      else {
            message.reply("Restarting Arisu system...");    
            client.destroy().then(() => {
                client.initialize(); // Reinitialize the client
            });
    }}


    //!report command
    if (textLower === '!report') {   
    if (!(await isAdmin(message))) {
        return message.reply("⛔ Access denied. Admins only, Sensei.");
    }
        else {
        const totalUsers = Object.keys(userData).length;
        message.reply(
        `Arisu System Report !!
        • Registered users: ${totalUsers}
        • Reminders active: ~Temporary only
        • Status: Operational 🟩
        Awaiting further input, Sensei !`
                );
        } }


     //!warn
    if (textLower.startsWith('!warn ')) {
    
     if (!(await isAdmin(message))) {
       return message.reply("⛔ Access denied. Admins only, Sensei.");
     }
      else {
            const mentioned = message.mentionedIds?.[0];
            if (!mentioned) {
                message.reply("Please tag a user to warn.");
            } else {
                warnings[mentioned] = (warnings[mentioned] || 0) + 1;
                message.reply(`Warning issued. ${warnings[mentioned]} warning(s) total.`);
            }
         }
    }


    //!warnings
    if (textLower.startsWith('!warnings')) {
    
        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }

            const mentioned = message.mentionedIds?.[0];
            if (!mentioned) {
                message.reply("Tag someone to check their warnings.");
            } else {
                const count = warnings[mentioned] || 0;
                message.reply(`This user has ${count} warning(s), Sensei.`);
            }
    }


    //!mute
    if (textLower.startsWith('!mute ')) {
    
    if (!(await isAdmin(message))) {
      return message.reply("⛔ Access denied. Admins only, Sensei.");
    }
        else {
              const parts = message.body.split(' ');
              const mentioned = message.mentionedIds?.[0];
              const timeStr = parts[2];

              if (!mentioned || !timeStr) {
                  message.reply("Usage: !mute @user 10s / 5m");
                  return;
              }

              const time = parseInt(timeStr);
              const unit = timeStr.slice(-1);
              let delay = 0;

              if (unit === 's') delay = time * 1000;
              else if (unit === 'm') delay = time * 60000;
              else {
                  message.reply("Invalid time format. Use s (seconds) or m (minutes).");
                  return;
              }

              muted[mentioned] = true;
              message.reply("Sensei, the User has been muted!");

              setTimeout(() => {
                  delete muted[mentioned];
                  message.reply(`Sensei, <@${mentioned}> has been unmuted!`);
              }, delay);
          }
    }


    //!unmute
    if (textLower.startsWith('!unmute')) {
    
    if (!(await isAdmin(message))) {
      return message.reply("⛔ Access denied. Admins only, Sensei.");
    }
     else {
            const mentioned = message.mentionedIds?.[0];
            if (!mentioned) {
                message.reply("Please tag someone to unmute.");
            } else {
                delete muted[mentioned];
                message.reply("User has been unmuted, Sensei.");
            }
        }
    }


    //Admin announcement 
    if (textLower.startsWith('!announce')) {
   
    if (!(await isAdmin(message))) {
      return message.reply("⛔ Access denied. Admins only, Sensei.");
    }
     else {
            const announcement = textLower.slice(9).trim();
            if (!announcement) {
                message.reply("What would you like to announce, Sensei?");
            } else {
                message.reply(`📣 Admin Notice: ${announcement}`);
            }
        }
    }


    //add admin
    if (textLower.startsWith('!addadmin')) {
        if (!isAdmin(message)) return message.reply("Access denied, Sensei.");

        const mentioned = message.mentionedIds;
        if (mentioned.length === 0) return message.reply("Tag the user you want to promote!");

        const admins = loadAdmins();
        let response = '';

        mentioned.forEach(id => {
          if (!admins.includes(id)) {
            admins.push(id);
            response += `✅ Added ${id} as admin.\n`;
          } else {
            response += `⚠ ${id} is already an admin.\n`;
          }
     });

        saveAdmins(admins);
        return message.reply(response.trim());
    }


    // Remove admin
    if (textLower.startsWith('!removeadmin')) {
        if (!isAdmin(message)) return message.reply("Access denied, Sensei.");

        const mentioned = message.mentionedIds;
        if (mentioned.length === 0) return message.reply("Tag the admin you want to remove!");

        const admins = loadAdmins();
        let response = '';

        mentioned.forEach(id => {
          if (admins.includes(id)) {
            const index = admins.indexOf(id);
            admins.splice(index, 1);
            response += `❌ Removed ${id} from admin list.\n`;
          } else {
            response += `⚠ ${id} is not an admin.\n`;
          }
        });
    
        saveAdmins(admins);
        return message.reply(response.trim());
    }


     //admin panel
     if (textLower === '!admin') {
       
        if (!(await isAdmin(message))) {
          return message.reply("⛔ Access denied. Admins only, Sensei.");
        }
         else {
                    message.reply(
                 `_*Welcome to the Admin Panel, Hirumi Sensei. What would you like to do?*_
                        
             🛡 *Arisu's Admin commands:*
                        
             • *!shutdown* - _Shutdown the bot_
             • *!restart* - _Restart the bot_
             • *!report* - _Get system report_
             • *!warn @user* - _Warn a user_
             • *!warnings @user*  - _Check warnings for a user_
             • *!mute @user [time]* - _Mute a user for a specified time (e.g. !mute @user 10s)_
             • *!unmute @user* - _Unmute a user_
             • *!announce [message]* - _Send an announcement to all users_
                        
             🛡 *Goodbye and Welcome ~*
                        
             • *!setwelcome [message]* - _Set a custom welcome message for new group members_
             • *!setgoodbye [message]* - _Set a custom goodbye message for leaving members_
             • *!testwelcome* - _Test the current welcome message_
             • *!testgoodbye* - _Test the current goodbye message_
                        
             🛡 *Admins ~*
                        
             • *!addadmin @user* - _Add a user to the admin list_
             • *!removeadmin @user* - _Remove a user from the admin list_
             • *!admin* - _Show this admin panel_
                        
             _*Are we eliminating anyone today, Sensei?*_`
            );
        }
     }
 

    // Help menu
    if (textLower === '!help') {
        message.reply(
        `🧭 *Arisu Command Index:*

        • *!id* – _Gets your personal message ID_
        • *!arisu* – _Wake me_
        • *!hello / !hi / !hey* – _Greet Arisu_
        • *!ping* – _Connectivity test_
        • *!quote* – _Receive motivational data_
        • *!about* – _System information_
        • *!say [message]* – _Make me say something_
        • *!register* [name] – _Register your name for personalized responses_
        • *!admin* – _Admin only: Access admin commands_
        • *!help* – _Show this menu_

        🧭 *Utility Commands:*

        • *!time* – _Get current time_
        • *!date* – _Get today's date_
        • *!remind [time] [message]* – _Set a reminder (e.g. !remind 10s drink water)_
        • *!link* – _Important links_
        • *!afk [reason]* – _Set AFK status_
        • *!back* – _Remove AFK status_
        • *!todo [task] / list / done [num]* – _Manage your to-do list_
        • *!quote [add / random / list]* – _Manage quotes_
        • *!bills [add / list / done [num] ]* – _Manage bills_
        • *!event [add / list]* – _Manage events_


        🧭 *Fun Commands:*

        • *!mal [anime]* – _Search MyAnimeList for an anime_
        • *!quoteanime* – _Get an anime quote_
        • *!waifu* – _Get a random waifu image_
        • *!gacha* – _Roll for a random anime character_
        • *!nyaa* – _Toggle Nyaa mode for cute responses_
        • *!reactions* – _List available reactions_
        • *!roll* – _Roll a dice_
        • *!cat* – _Get a random cat image_
        • *!sticker* – _Converts Image to Sticker_
        • *!unsticker* – _Converts Sticker to Image_

        _*Awaiting further instructions, Sensei!*_`
                );
    }


    // Reactions command
    if (textLower === '!reactions') {
        message.reply(
        `
        🧭 *Custom Reactions:*

        • *!hug* – _Send a hug gif_
        • *!pat* – _Send a pat gif_
        • *!bonk* – _Send a bonk gif_
        • *!kiss* – _Send a kiss gif_
        • *!slap* – _Send a slap gif_
        • *!poke* – _Send a poke gif_
        • *!cuddle* – _Send a cuddle gif_
        • *!lick – _Send a lick gif_
        • *!handhold* – _Send a handhold gif_
        • *!highfive* – _Send a high-five gif_
        • *!wave* – _Send a wave gif_
        • *!stare* – _Send a stare gif_
        • *!wink* – _Send a wink gif_
        • *!blush* – _Send a blush gif_
        • *!cry* – _Send a cry gif_
        • *!pout* – _Send a pout gif_
        •

        _*Awaiting further instructions, Sensei!*_
        `        );
    }


    // Rent Commands
     if (textLower === '!rent') {
        message.reply(
        `🧭 *Arisu's Rent Commands:*

        • *!rent addmember [name]* – _Add a new member to the rent tracker_
        • *!rent addbill [bill name]* – _Add a new bill for all members_
        • *!rent paid [name] [bill name]* – _Use comma-separated names to mark bills as paid_
        • *!rent unpaid [name] [bill name]* – _Use comma-separated names to mark bills as unpaid_

        🧭 *Rent List Commands:*

        • *!rent list* – _List all members and their rent status_
        • *!rent list bill* – _List all bill and their rent status_
        • *!rent summary* – _Summarizes the bill_
        • *!rent status [bill name]* – _Shows the bill status for all members_
        • *!rent emoji [month]* – _Shows the summary in for the month/selected month in emoji graph_

        🧭 *Rent Removal Commands:*

        • *!rent remove [member] [bill]* – _Removes member from the month/bill_
        • *!rent removebill* – _Removes bill from the month_

        • *!rent nextmonth* – _Initialize the next month with all members and bills_

        _*Awaiting further instructions, Sensei!*_
        `        );    
    }
            
// 💤 Arisu-AI AFK Detection///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function detectLang(text) {
  if (!text || typeof text !== 'string') return 'en';

  const malayWords = ['saya', 'awak', 'pergi', 'makan', 'tidur', 'mandi', 'main', 'tak', 'nak', 'boleh', 'je', 'kat'];
  const lowerText = text.toLowerCase();

  let score = 0;
  for (const word of malayWords) {
    if (lowerText.includes(word)) score++;
  }

  return score >= 2 ? 'ms' : 'en'; // if 2 or more Malay words detected, assume Malay
}


let arisuHandled = false;

if (textLower.includes("arisu")) {
  const afkLikePattern = /\b(afk|brb|be right back|nak\s+\w+|pergi\s+\w+|i (need|have|want) to (go|rest|eat|sleep|shower|pray))\b/i;

  if (afkLikePattern.test(textLower)) {
    const afkReason = parseAfkIntent(textRaw);
    if (afkReason) {
      afkData[normalizedSender] = {
        reason: afkReason,
        time: Date.now()
      };
      fs.writeFileSync(afkPath, JSON.stringify(afkData, null, 2));

      const lowerReason = afkReason.toLowerCase();
      let extraReplies = [];

      if (lowerReason.includes("makan")) {
        extraReplies = [
          "Ehh~ makan tanpa Arisu? Jelesnyaa 😤",
          "Jangan lupa suap Arisu sikit tau~",
          "Arisu tunggu kat sini je~ makan elok² kay?",
        ];
      } else if (lowerReason.includes("mandi")) {
        extraReplies = [
          "Mandi time~ jangan lupa sabun betul-betul ehehe~",
          "Haa, jangan lama sangat tau! Nanti Arisu rinduuu~",
          "Bersih-bersih time! Arisu standby sini je~",
        ];
      } else if (lowerReason.includes("tidur") || lowerReason.includes("sleep")) {
        extraReplies = [
          "Oyasumi~ Arisu doakan mimpi manis 💫",
          "Good night, Sensei~ Arisu tunggu sampai Sensei bangun! 💤",
          "Tidur dulu ye~ Arisu bagi buff rehat +10!",
        ];
      } else if (lowerReason.includes("solat")) {
        extraReplies = [
          "Solat dulu ye~ Arisu tunggu kat checkpoint ni~",
          "Ehehe~ Arisu bangga dengan Sensei 😌",
          "Go go solat team! Arisu standby~",
        ];
      } else if (lowerReason.includes("ml") || lowerReason.includes("rank") || lowerReason.includes("game")) {
        extraReplies = [
          "Ooo push rank ke?? LET'S GOOO~ 💪",
          "Semoga dapat MVP! Arisu cheering from base~",
          "Game time! Jangan tilt okay~ Arisu kasi luck buff ✨",
        ];
      }

      const notedPhrases = [
        "Alrighty~ Arisu noted it!",
        "Okay okay~ AFK time logged!",
        "Roger that! Arisu’ll handle the rest~",
        "Aye aye, Sensei~ AFK registered~",
        "Noted with a big heart~ 💙 Arisu got it!",
        "AFK mission accepted~ ehehe~",
        "Leave it to Arisu~ will keep watch while you're away!",
        "Mhm~ pencatat rasmi AFK dah take note!"
      ];

      const chosenNoted = notedPhrases[Math.floor(Math.random() * notedPhrases.length)];
      const extra = extraReplies.length > 0 ? `\n\n${extraReplies[Math.floor(Math.random() * extraReplies.length)]}` : "";

      let icon = "💤";
      if (lowerReason.includes("makan")) icon = "🍚";
      else if (lowerReason.includes("mandi")) icon = "🛁";
      else if (lowerReason.includes("solat")) icon = "🕌";
      else if (lowerReason.includes("tidur") || lowerReason.includes("sleep")) icon = "🛌";
      else if (lowerReason.includes("ml") || lowerReason.includes("rank") || lowerReason.includes("game")) icon = "🎮";
      else if (lowerReason.includes("toilet") || lowerReason.includes("buang air")) icon = "🚽";

      const cuteReply = `${chosenNoted}\n\nAFK because: *${afkReason}* ${icon}${extra}`;
      await message.reply(cuteReply);

      arisuHandled = true;
    }
  }
}

// ❗ Exit early if it's a command or handled above
if (textLower.startsWith("!") || arisuHandled) return;

// 🤖 Arisu AI Logic
console.log("✅ Entering Arisu-AI block...");

// 🎭 Tone detection
let tone = "neutral";
if (/!{2,}/.test(textRaw) || /[A-Z]{3,}/.test(textRaw)) tone = 'excited';
else if (/\.{2,}/.test(textRaw)) tone = 'calm';
else if (/\?{2,}/.test(textRaw)) tone = 'confused';

// 🎯 Pattern matching
const casualMentionMatch = textRaw.match(/^(arisu+)[\s!?~.,]*(.*)$/i);
const calledCasually = /^arisu[\s!?.~]*$/i.test(textLower);
const mentionedWithMessage = /^arisu[\s:]/i.test(textLower);

// ✅ 1. Just "Arisu!"
if (calledCasually) {
  console.log("👋 Arisu called casually");

  const replies = {
    neutral: [
      "Hai hai, Sensei? I'm here~",
      "Yes yes, Arisu kat sini je~",
      "Hehe, standby mode aktif~",
    ],
    excited: [
      "Wahhh!! Arisu is on it!!",
      "Quest accepted! 🎯",
      "Present! Arisu datang bawa buff~",
    ],
    calm: [
      "Mmm... sleepy mode off...",
      "Humuu~ Did I hear something?",
    ],
    confused: [
      "Eh? Repeat sikit boleh? Hehe~",
      "Humuu... Arisu lost signal jap 😵",
    ]
  };

  const pool = replies[tone] || replies.neutral;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return message.reply(chosen);
}

// ✅ 2. "Arisu, message here" or "Arisuuu makan dulu"
if (mentionedWithMessage || casualMentionMatch) {
  const promptText = mentionedWithMessage
    ? textRaw.replace(/^arisu[\s:]+/i, '').trim()
    : (casualMentionMatch?.[2] || "").trim();

  if (!promptText) {
    return message.reply("Hai hai, Sensei! I'm listening~");
  }

  try {
    const lang = detectLang(promptText);
    const response = await getArisuReply(promptText, tone, lang); // your AI logic
    return message.reply(response);
  } catch (err) {
    console.error("💥 Arisu AI error:", err);
    return message.reply("A-Arisu's brain glitched... Please try again later, Sensei!");
  }
}




});



client.initialize();