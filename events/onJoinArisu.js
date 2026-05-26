// 📁 events/onJoinArisu.js 
module.exports = (client) => { client.on('group_join', async (notification) => { try { const participants = notification.recipientIds || notification.participants;

// ✅ Check if Arisu herself is the one being added
  if (participants.includes(client.info.wid._serialized)) {
    const chat = await notification.getChat();

    const softIntro = `✨ Hello! Arisu.AI has joined the group.\nType \`!introduce\` if you'd like me to say hi, Sensei~`;

    console.log(`✅ Arisu joined a new group: ${chat.name} (${chat.id._serialized})`);
    console.log("📤 Sending soft intro message after short delay...");

    setTimeout(async () => {
      try {
        // Get the chat object and send message directly
        const chatObj = await client.getChatById(chat.id._serialized);
        await chatObj.sendMessage(softIntro);
        console.log("✅ Soft intro message sent.");
      } catch (sendErr) {
        console.error("❌ Failed to send Arisu's intro message:", sendErr);
        // Fallback: try a simple approach if the above fails
        try {
          console.log("🔄 Trying fallback approach...");
          await client.sendMessage(chat.id._serialized, softIntro);
        } catch (fallbackErr) {
          console.error("❌ Fallback also failed:", fallbackErr);
        }
      }
    }, 5000); // wait 5 seconds
  }
} catch (err) {
  console.error('❌ Error during Arisu join intro:', err);
}

}); };




