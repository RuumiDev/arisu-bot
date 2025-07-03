
const malayBills = {
  air: "water",
  hydro: "water",
  api: "electricity",
  apii: "electricity",
  elektrik: "electricity",
  elektrikk: "electricity",
  elektrikkk: "electricity",
  karen: "electricity",
  current: "electricity",
  elektri: "electricity",
  electro: "electricity",
  electric: "electricity",
  letrik: "electricity",
  listrik: "electricity",
  wifi: "wifi",
  wfi: "wifi",
  wiffi: "wifi",
  internet: "wifi",
  ternet: "wifi",
  tenet: "wifi",
};



const noiseWords = [
  "bill", "dgn", "dan", "arisu", "tau", "ye", "je", "lah", "lagi", "lgi",
  "lagi,", "je,", "lah,", "pun", "eh", "ye", "kot", "haa", "ha", "weh", "byr","bayar",
  "baya","boleh", "ke", "je", "la", "pun", "je", "eh", "nak", "nk", "please", "pls", "yea", 
  "yeah", "okay", "ok", "ka", "tu", "je", "tadi", "nanti", "je", "kan", "lagi", "tak", "tu",
  "tolong", "nak", "nk", "sekali", "jugak", "juga", "sikit", "saja", "jom", "dah", "dh",
];

function detectLang(text) {
  const malayWords = [
    "tak", "kau", "jap", "weh", "bukan", "saja", "dah", "ke", "aku", "lah", "ni", "pun", "sini", "tu", "sana",
    "macam", "cakap", "boleh", "ada", "apa", "yang", "dengan", "saya", "kita", "awak", "dia", "mereka", "sikit",
    "banyak", "semua", "semalam", "esok", "bulan", "tahun", "sekarang", "nanti", "baru", "lama", "sudah", "belum",
    "pergi", "datang", "balik", "jangan", "kenapa", "khabar", "baik", "terima", "maaf", "tolong", "sila",
    "selamat", "jumpa", "tinggal", "pagi", "petang", "malam"
  ];
  const words = text.toLowerCase().split(/\s+/);
  const malayScore = words.filter(w => malayWords.includes(w)).length;
  return malayScore >= 2 ? "ms" : "en";
}

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Fuzzy bill matcher
function normalizeBills(inputBills) {
  return inputBills
    .map(b => b.toLowerCase().trim())
    .filter(b => b && !noiseWords.includes(b)) // Remove noise again
    .map(b => malayBills[b] || b);
}



function cleanBillPart(billPart) {
  let cleaned = billPart.toLowerCase();

  // Break into words first
  let words = cleaned.split(/\s+/);

  const cleanedWords = words.map(w => {
    for (const noise of noiseWords) {
      // unstuck suffix (e.g. airlgi → air)
      if (w.endsWith(noise) && w.length > noise.length + 1) {
        return w.replace(new RegExp(noise + "$", "i"), "");
      }
      // unstuck prefix (e.g. lgiair → air)
      if (w.startsWith(noise) && w.length > noise.length + 1) {
        return w.replace(new RegExp("^" + noise, "i"), "");
      }
    }
    return w;
  });

  return cleanedWords
    .filter(w => w && !noiseWords.includes(w))
    .join(" ")
    .trim();
}





function parse(text) {
  const textLower = text.toLowerCase();
  if (!textLower.includes("arisu")) return null;

  const lang = detectLang(text);
  
const paidMatch = textLower.match(
  new RegExp(`([\\w\\s,dan]+?)\\s+(?:dah|dh|sudah|telah|da|suda)\\s+(.*)`)
);

const unpaidMatch = textLower.match(
  new RegExp(`([\\w\\s,dan]+?)\\s+(?:belum|blum|belom|belun|tak|tk|tidak|x|masih\\s+belum)\\s+(.*)`)
);






  // 🟢 PAID / UNPAID intent
if (unpaidMatch) {
    

  const match = unpaidMatch;
  const intent = "unpaid";

  let namePart = match[1].trim();
  let isAll = false;
  const semuaRegex = /\b(?:semua|sume|suma|sumua|smua|all)\b/i;
  if (semuaRegex.test(namePart)) {
    isAll = true;
  }

  const billPart = cleanBillPart(match[2].trim());
    namePart = namePart.replace(/\barisu\b/gi, "").trim(); // ← NEW
    console.log("[DEBUG] Original bill part:", match[2]);
    console.log("[DEBUG] Cleaned bill part:", billPart);
    


  let names;
    if (isAll) {
      names = ["ALL_MEMBERS"];
    } else {
      names = namePart
        .split(/\s*(?:\bdan\b|\bdgn\b|,|\band\b)\s*/i)
        .map(n => n.trim())
        .filter(n => n && n.toLowerCase() !== "arisu");
    }


  const rawBills = billPart
    .split(/[,\/\s]+/)
    .map(b => b.trim().toLowerCase())
    .filter(Boolean);


  const bills = normalizeBills(rawBills);

    console.log("[DEBUG] Cleaned bill part:", billPart);
    console.log("[DEBUG] Raw bills:", rawBills);
    console.log("[DEBUG] Final normalized bills:", bills);

  return {
    intent,
    names,
    bills,
    lang,
  };
}

if (paidMatch) {
   
  const match = paidMatch;
  const intent = "paid";

  let namePart = match[1].trim();
  let isAll = false;
  const semuaRegex = /\b(?:semua|sume|suma|sumua|smua|all)\b/i;
  if (semuaRegex.test(namePart)) {
    isAll = true;
  }


  const billPart = cleanBillPart(match[2].trim());
    namePart = namePart.replace(/\barisu\b/gi, "").trim(); // ← NEW
    console.log("[DEBUG] Original bill part:", match[2]);
    console.log("[DEBUG] Cleaned bill part:", billPart);


  let names;
    if (isAll) {
      names = ["ALL_MEMBERS"];
    } else {
      names = namePart
        .split(/\s*(?:\bdan\b|\bdgn\b|,|\band\b)\s*/i)
        .map(n => n.trim())
        .filter(n => n && n.toLowerCase() !== "arisu");
    }


  const rawBills = billPart
    .split(/[,\/\s]+/)
    .map(b => b.trim().toLowerCase())
    .filter(Boolean);

  const bills = normalizeBills(rawBills);

    console.log("[DEBUG] Cleaned bill part:", billPart);
    console.log("[DEBUG] Raw bills:", rawBills);
    console.log("[DEBUG] Final normalized bills:", bills);

  return {
    intent,
    names,
    bills,
    lang,
  };
}


  // 🟢 LIST MEMBERS (Natural Language)
  if (
    (textLower.includes("siapa") && textLower.includes("sewa")) ||
    (textLower.includes("list") && (textLower.includes("member") || textLower.includes("orang") || textLower.includes("penyewa"))) ||
    (textLower.includes("senarai") && (textLower.includes("ahli") || textLower.includes("penyewa"))) ||
    textLower.match(/(who|list).*(rent|member|tenant)/)
  ) {
    return { intent: "list_members", lang };
  }

  // 🟢 LIST BILLS
  if (
    textLower.includes("bill") && (textLower.includes("list") || textLower.includes("senarai"))
  ) {
    return { intent: "list_bills", lang };
  }

  // 🟢 Fallback to member list
  if (textLower.includes("list") || textLower.includes("senarai")) {
    return { intent: "list_members", lang };
  }

  // 🟢 Casual/Natural phrasing for bill status
  if (
    textLower.includes("arisu") &&
    (textLower.includes("siapa") || textLower.includes("sape") || textLower.includes("bayar") || textLower.includes("ada") || textLower.includes("xde") || textLower.includes("xdak"))
  ) {
    const detected = Object.keys(malayBills).filter(b => textLower.includes(b));
    const bills = detected.map(b => malayBills[b] || b);
    if (bills.length > 0) {
      return {
        intent: "status_bill",
        bills,
        lang,
      };
    }
  }

  // 🟢 Intent: status for specific bill via casual trigger (nk bill, nak tengok, etc.)
  if (
        textLower.match(/\b(siapa|sape|status|apa|tgk|check|semak|nk|nak|yang|dah|belum)\b/) &&
        Object.keys(malayBills).some(b => textLower.includes(b)) &&
        textLower.includes("arisu")
    ) {
      const bills = Object.keys(malayBills).filter(b => textLower.includes(b)).map(b => malayBills[b] || b);
      return { intent: "status_bill", bills, lang };
    }


    // 🟢 Check if user wants full summary per member
   if (
  textLower.includes("arisu") &&
  textLower.match(/\b(status|nk|nak|check|tengok|tgk|semak|apa|macam)\b/) &&
  textLower.match(/\b(bill|sewa|rent)\b/)
    ) {
        return {
        intent: "status_permember", 
        lang,
      };
    }




  return null;
}


module.exports = {
  parse,
  formatName,
  detectLang,
  malayBills,
};
