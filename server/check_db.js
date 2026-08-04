const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Job = require('./models/Job');

    const query = { $or: [{ scope: "general" }, { scope: { $exists: false } }, { scope: null }] };
    const jobs = await Job.find(query);
    
    console.log('Fixed query job count:', jobs.length);
  } catch(e) {
      console.error(e);
  } finally {
      mongoose.disconnect();
  }
}
test();
