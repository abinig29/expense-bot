import { DatabaseService } from "./databaseService";

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: Date;
}

export class CategoryService {
  private static instance: CategoryService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    const query = `
      SELECT id, name, icon, color, is_default, created_at
      FROM categories
      ORDER BY name ASC
    `;

    const result = await this.dbService.query(query);
    return result.rows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Get default categories only
   */
  async getDefaultCategories(): Promise<Category[]> {
    const query = `
      SELECT id, name, icon, color, is_default, created_at
      FROM categories
      WHERE is_default = true
      ORDER BY name ASC
    `;

    const result = await this.dbService.query(query);
    return result.rows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Get category by name (case-insensitive)
   */
  async getCategoryByName(name: string): Promise<Category | null> {
    const query = `
      SELECT id, name, icon, color, is_default, created_at
      FROM categories
      WHERE LOWER(name) = LOWER($1)
    `;

    const result = await this.dbService.query(query, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      created_at: new Date(row.created_at),
    };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const query = `
      SELECT id, name, icon, color, is_default, created_at
      FROM categories
      WHERE id = $1
    `;

    const result = await this.dbService.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      created_at: new Date(row.created_at),
    };
  }

  /**
   * Create a new category
   */
  async createCategory(
    name: string,
    icon?: string,
    color?: string
  ): Promise<Category> {
    const query = `
      INSERT INTO categories (name, icon, color, is_default)
      VALUES ($1, $2, $3, false)
      RETURNING id, name, icon, color, is_default, created_at
    `;

    const result = await this.dbService.query(query, [
      name,
      icon || "📦",
      color || "#95A5A6",
    ]);
    const row = result.rows[0];

    return {
      ...row,
      created_at: new Date(row.created_at),
    };
  }

  /**
   * Update a category
   */
  async updateCategory(
    id: number,
    updates: Partial<Category>
  ): Promise<Category | null> {
    const allowedFields = ["name", "icon", "color"];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && value !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return this.getCategoryById(id);
    }

    values.push(id);
    const query = `
      UPDATE categories
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, icon, color, is_default, created_at
    `;

    const result = await this.dbService.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      created_at: new Date(row.created_at),
    };
  }

  /**
   * Delete a category (only if it's not default and not used by any expenses)
   */
  async deleteCategory(id: number): Promise<boolean> {
    // Check if category is default
    const category = await this.getCategoryById(id);
    if (!category || category.is_default) {
      return false;
    }

    // Check if category is used by any expenses
    const expenseCheck = await this.dbService.query(
      "SELECT COUNT(*) as count FROM expenses WHERE category_id = $1",
      [id]
    );

    if (parseInt(expenseCheck.rows[0].count) > 0) {
      return false;
    }

    // Delete the category
    const result = await this.dbService.query(
      "DELETE FROM categories WHERE id = $1",
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Find or create category by name
   */
  async findOrCreateCategory(name: string): Promise<Category> {
    // First try to find existing category
    const existing = await this.getCategoryByName(name);
    if (existing) {
      return existing;
    }

    // If not found, create a new one
    return await this.createCategory(name);
  }

  /**
   * Search categories by name (partial match)
   */
  async searchCategories(searchTerm: string): Promise<Category[]> {
    const query = `
      SELECT id, name, icon, color, is_default, created_at
      FROM categories
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY name ASC
    `;

    const result = await this.dbService.query(query, [`%${searchTerm}%`]);
    return result.rows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Get category usage statistics
   */
  async getCategoryUsageStats(): Promise<
    Record<string, { count: number; total: number }>
  > {
    const query = `
      SELECT 
        c.name,
        COUNT(e.id) as count,
        COALESCE(SUM(e.amount), 0) as total
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `;

    const result = await this.dbService.query(query);
    const stats: Record<string, { count: number; total: number }> = {};

    result.rows.forEach((row) => {
      stats[row.name] = {
        count: parseInt(row.count),
        total: parseFloat(row.total),
      };
    });

    return stats;
  }
}
