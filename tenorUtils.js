// tenorUtils.js
const axios = require('axios');

const TENOR_API_KEY = 'AIzaSyCoXDKP-qljTq17jhCzaB3pmTv5dUJ3jHw'; // Replace with actual API key
const TENOR_LIMIT = 1;

async function fetchTenorGif(query) {
  const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}&media_filter=gif,tinygif&contentfilter=high`;
  console.log("🔍 Fetching from Tenor:", url);

  const res = await axios.get(url);

  if (!res.data || !res.data.results || res.data.results.length === 0) {
    console.warn("⚠ No GIF results from Tenor for:", query);
    return null;
  }

  const result = res.data.results[0];
  const mp4Url = result.media_formats?.tinygif?.url;
  console.log("🎬 Tenor GIF URL:", mp4Url);
  return mp4Url;
}

module.exports = { fetchTenorGif };

