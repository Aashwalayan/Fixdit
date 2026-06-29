require('dotenv').config();

const connectDB = require('../config/db.cjs');
const { bootstrapAdminFromEnv } = require('../utils/adminLifecycle.cjs');

const main = async () => {
  await connectDB();

  try {
    const result = await bootstrapAdminFromEnv();
    if (result.created) {
      console.log(`Created bootstrap admin account for ${result.admin.email}.`);
    } else {
      console.log(`Bootstrap skipped (${result.reason || 'no-op'}).`);
    }
  } catch (error) {
    console.error(`Bootstrap admin failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

main();
