require("dotenv").config();
const { Pool } = require("pg");

console.log("🔄 Database Migration Script\n");

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

async function migrateDatabase() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking current database schema...");

    // Check if categories table exists
    const categoriesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);

    const categoriesExist = categoriesCheck.rows[0].exists;

    if (!categoriesExist) {
      console.log("📋 Creating categories table...");
      await client.query(`
        CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          icon VARCHAR(10),
          color VARCHAR(7),
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Categories table created");
    } else {
      console.log("✅ Categories table already exists");
    }

    // Check current expenses table structure
    const columnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("\n📊 Current expenses table columns:");
    columnsCheck.rows.forEach((row) => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });

    // Check if category_id column exists
    const hasCategoryId = columnsCheck.rows.some(
      (row) => row.column_name === "category_id"
    );
    const hasCategoryName = columnsCheck.rows.some(
      (row) => row.column_name === "category_name"
    );
    const hasDescription = columnsCheck.rows.some(
      (row) => row.column_name === "description"
    );

    if (!hasCategoryId) {
      console.log("\n🔧 Adding category_id column...");
      await client.query(`
        ALTER TABLE expenses 
        ADD COLUMN category_id INTEGER REFERENCES categories(id)
      `);
      console.log("✅ category_id column added");
    }

    if (!hasCategoryName) {
      console.log("\n🔧 Adding category_name column...");
      await client.query(`
        ALTER TABLE expenses 
        ADD COLUMN category_name VARCHAR(255)
      `);
      console.log("✅ category_name column added");
    }

    if (!hasDescription) {
      console.log("\n🔧 Adding description column...");
      await client.query(`
        ALTER TABLE expenses 
        ADD COLUMN description TEXT
      `);
      console.log("✅ description column added");
    }

    // Update existing expenses to have category_name if they don't have it
    if (hasCategoryName) {
      console.log("\n🔧 Updating existing expenses with category names...");
      await client.query(`
        UPDATE expenses 
        SET category_name = category 
        WHERE category_name IS NULL AND category IS NOT NULL
      `);
      console.log("✅ Existing expenses updated with category names");
    }

    // Insert default categories
    console.log("\n📝 Inserting default categories...");
    const defaultCategories = [
      { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B", is_default: true },
      { name: "Loan", icon: "💰", color: "#FF6B6B", is_default: true },
      {
        name: "Transportation",
        icon: "🚗",
        color: "#4ECDC4",
        is_default: true,
      },
      { name: "Shopping", icon: "🛍️", color: "#45B7D1", is_default: true },
      { name: "Entertainment", icon: "🎬", color: "#96CEB4", is_default: true },
      { name: "Healthcare", icon: "🏥", color: "#FFEAA7", is_default: true },
      { name: "Utilities", icon: "⚡", color: "#DDA0DD", is_default: true },
      { name: "Housing", icon: "🏠", color: "#98D8C8", is_default: true },
      { name: "Education", icon: "📚", color: "#F7DC6F", is_default: true },
      { name: "Travel", icon: "✈️", color: "#BB8FCE", is_default: true },
      { name: "Personal Care", icon: "💄", color: "#F8C471", is_default: true },
      { name: "Gifts", icon: "🎁", color: "#E74C3C", is_default: true },
      { name: "Insurance", icon: "🛡️", color: "#3498DB", is_default: true },
      { name: "Investments", icon: "📈", color: "#2ECC71", is_default: true },
      { name: "Subscriptions", icon: "📱", color: "#9B59B6", is_default: true },
      { name: "Other", icon: "📦", color: "#95A5A6", is_default: true },
    ];

    for (const category of defaultCategories) {
      await client.query(
        `
        INSERT INTO categories (name, icon, color, is_default)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `,
        [category.name, category.icon, category.color, category.is_default]
      );
    }
    console.log("✅ Default categories inserted");

    // Create indexes
    console.log("\n🔍 Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    `);
    console.log("✅ Indexes created");

    // Show final table structure
    const finalColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("\n📊 Final expenses table structure:");
    finalColumns.rows.forEach((row) => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });

    console.log("\n🎉 Database migration completed successfully!");
    console.log("💡 Your bot should now work with the new category system.");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("💡 Please check the error and try again.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrateDatabase();
