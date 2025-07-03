// mediaUtils.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

async function gifToMp4(gifUrl, outputName = 'reaction.mp4') {
  const gifPath = path.join(__dirname, 'temp.gif');
  const mp4Path = path.join(__dirname, outputName);//mp4

  // 🔽 Download GIF
  const response = await axios({
    url: gifUrl,
    method: 'GET',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(gifPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  // 🔄 Convert to WhatsApp-safe MP4
 
await new Promise((resolve, reject) => {
          ffmpeg(gifPath)
            .outputOptions([
              '-movflags', 'faststart',
              '-pix_fmt', 'yuv420p',
              '-vf', 'scale=480:-2',
              '-r', '15',
              '-an'
            ])
            .videoCodec('libx264')
            .format('mp4')
            .on('start', (cmdLine) => console.log("🎬 FFmpeg started:", cmdLine))
            .on('stderr', (line) => console.log("📼 FFmpeg Log:", line))
            .on('end', resolve)
            .on('error', reject)
            .save(mp4Path);

    });


  fs.unlinkSync(gifPath); // 🧹 Clean up temp GIF
  return mp4Path;
}

module.exports = { gifToMp4 };
