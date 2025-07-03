// utils/stickerUtils.js
const sharp = require("sharp");

async function convertToWebpSticker(media) {
  const imgBuffer = Buffer.from(media.data, "base64");

  const webpBuffer = await sharp(imgBuffer)
    .resize(512, 512, { fit: "inside" }) // WhatsApp optimal size
    .webp({ quality: 80 })
    .toBuffer();

  return webpBuffer;
}

module.exports = {
  convertToWebpSticker,
};


