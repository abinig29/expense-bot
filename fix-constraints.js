require("dotenv").config();
const { Pool } = require("pg");

console.log("🔧 Fixing Database Constraints...\n");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixConstraints() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking current constraints...");

    // Make the old category column nullable since we're using category_name now
    console.log("🔧 Making category column nullable...");
    await client.query(`
      ALTER TABLE expenses 
      ALTER COLUMN category DROP NOT NULL
    `);
    console.log("✅ category column is now nullable");

    // Also make sure category_name is NOT NULL
    console.log("🔧 Making category_name column NOT NULL...");
    await client.query(`
      ALTER TABLE expenses 
      ALTER COLUMN category_name SET NOT NULL
    `);
    console.log("✅ category_name column is now NOT NULL");

    // Make description column NOT NULL
    console.log("🔧 Making description column NOT NULL...");
    await client.query(`
      ALTER TABLE expenses 
      ALTER COLUMN description SET NOT NULL
    `);
    console.log("✅ description column is now NOT NULL");

    console.log("\n🎉 Database constraints fixed successfully!");
    console.log("💡 Your bot should now work without constraint errors.");
  } catch (error) {
    console.error("\n❌ Failed to fix constraints:", error.message);
    console.error("💡 Please check the error and try again.");
  } finally {
    client.release();
    await pool.end();
  }
}

fixConstraints();
