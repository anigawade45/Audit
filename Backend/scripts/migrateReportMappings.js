const mongoose = require("mongoose");
require("dotenv").config();
const ReportMapping = require("../models/ReportMapping");
const AccountHead = require("../models/AccountHead");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const docs = await ReportMapping.find({});
  for (const doc of docs) {
    const mappingsObj = doc.mappings instanceof Map ? Object.fromEntries(doc.mappings) : doc.mappings || {};
    let changed = false;
    const newMappings = {};
    for (const [key, val] of Object.entries(mappingsObj)) {
      if (mongoose.Types.ObjectId.isValid(key)) {
        newMappings[key] = val;
        continue;
      }
      const head = await AccountHead.findOne({ societyId: doc.societyId, name: key });
      if (head) {
        const id = String(head._id);
        if (!newMappings[id]) {
          newMappings[id] = val;
          changed = true;
        }
      } else {
        console.warn(`AccountHead not found for society=${doc.societyId} name=${key}`);
      }
    }
    if (changed) {
      doc.mappings = newMappings;
      await doc.save();
      console.log(`Migrated mappings for doc ${doc._id}`);
    }
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
