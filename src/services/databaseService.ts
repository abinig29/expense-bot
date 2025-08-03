import { Pool, PoolClient } from "pg";

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Test the connection
    this.testConnection();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log("✅ Database connection successful");
      client.release();
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  public async initializeTables(): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Create categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          icon VARCHAR(10),
          color VARCHAR(7),
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create expenses table
      await client.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(10,2) NOT NULL,
          category_id INTEGER REFERENCES categories(id),
          category_name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          date TIMESTAMP NOT NULL,
          user_id BIGINT NOT NULL,
          message_id BIGINT NOT NULL,
          chat_id BIGINT NOT NULL,
          topic_id BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for faster queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_chat_id ON expenses(chat_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
        CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      `);

      // Insert default categories if they don't exist
      await this.insertDefaultCategories(client);

      console.log("✅ Database tables initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing database tables:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertDefaultCategories(client: PoolClient): Promise<void> {
    const defaultCategories = [
      { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B", is_default: true },
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

    console.log("✅ Default categories inserted successfully");
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  // Helper method to execute queries with automatic client management
  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
}
