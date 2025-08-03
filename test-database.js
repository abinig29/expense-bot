require("dotenv").config();
const { Pool } = require("pg");

console.log("🗄️ Testing PostgreSQL Database Connection...\n");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error(
    "Please create a .env file with your database connection string"
  );
  process.exit(1);
}

console.log("📝 Database URL found in environment variables");
console.log("🔗 Connecting to PostgreSQL...\n");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testDatabase() {
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log("✅ Database connection successful!");

    // Test a simple query
    const result = await client.query("SELECT NOW() as current_time");
    console.log("✅ Query test successful!");
    console.log(`📅 Current database time: ${result.rows[0].current_time}`);

    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log("\n📋 Existing tables:");
    if (tablesResult.rows.length === 0) {
      console.log("   No tables found (this is normal for a new database)");
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`   • ${row.table_name}`);
      });
    }

    client.release();

    console.log("\n🎉 Database connection test completed successfully!");
    console.log("💡 Your bot should now be able to connect to the database.");
  } catch (error) {
    console.error("\n❌ Database connection failed:", error.message);
    console.log("\n💡 Troubleshooting tips:");
    console.log("   1. Check your internet connection");
    console.log("   2. Verify the database URL is correct");
    console.log("   3. Make sure the database is accessible");
    console.log("   4. Check if your IP is whitelisted (if required)");
  } finally {
    await pool.end();
  }
}

testDatabase();
