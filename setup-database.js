const fs = require("fs");
const path = require("path");

console.log("🗄️  Database Setup for Telegram Expense Bot\n");

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.log(
    "❌ .env file not found. Please run npm run setup first to create it."
  );
  process.exit(1);
}

console.log("📝 Setting up PostgreSQL database connection...\n");

console.log("You provided this connection string:");
console.log(
  "postgresql://neondb_owner:npg_BClnfdqP4m2s@ep-solitary-rice-aexkpa1q-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require\n"
);

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Do you want to use this connection string? (y/n): ", (answer) => {
  if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
    const connectionString =
      "postgresql://neondb_owner:npg_BClnfdqP4m2s@ep-solitary-rice-aexkpa1q-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

    // Read current .env file
    let envContent = fs.readFileSync(envPath, "utf8");

    // Check if DATABASE_URL already exists
    if (envContent.includes("DATABASE_URL=")) {
      // Replace existing DATABASE_URL
      envContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL=${connectionString}`
      );
    } else {
      // Add DATABASE_URL to the end
      envContent += `\n# Database Configuration\nDATABASE_URL=${connectionString}`;
    }

    // Write updated .env file
    fs.writeFileSync(envPath, envContent);

    console.log("✅ Database connection string added to .env file!");
    console.log("\n🚀 You can now start your bot:");
    console.log("   npm start");
    console.log("\n💡 The bot will automatically:");
    console.log("   • Connect to your PostgreSQL database");
    console.log("   • Create the necessary tables");
    console.log("   • Store all expenses persistently");
  } else {
    console.log("❌ Database setup cancelled.");
    console.log(
      "💡 You can manually add DATABASE_URL to your .env file later."
    );
  }

  rl.close();
});
