const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const ReportMapping = require("../models/ReportMapping");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const docs = await ReportMapping.find({});
  let changedDocs = 0;
  for (const doc of docs) {
    const src = doc.mappings instanceof Map ? Object.fromEntries(doc.mappings) : doc.mappings || {};
    let changed = false;
    const next = {};
    for (const [k, v] of Object.entries(src)) {
      if (k.includes(":")) {
        next[k] = v;
        continue;
      }
      const s = String(v?.side || "").toLowerCase();
      if (mongoose.Types.ObjectId.isValid(k) && (s === "debit" || s === "credit")) {
        const composite = `${k}:${s}`;
        if (!next[composite]) next[composite] = v;
        changed = true;
      } else {
        // preserve as-is if invalid; better to keep than drop
        next[k] = v;
      }
    }
    if (changed) {
      doc.mappings = next;
      await doc.save();
      changedDocs++;
      console.log(`Upgraded mappings to composite for document ${doc._id}`);
    }
  }
  console.log(`Migration complete. Updated ${changedDocs} documents.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

