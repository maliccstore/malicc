import { Service } from "typedi";
import { Product } from "../models/ProductModel";
import { Op, literal } from "sequelize";
import { Inventory } from "../models/Inventory";

@Service()
export class ProductService {
  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string[];
    isActive: boolean;
    sku?: string;
    initialQuantity?: number;
  }): Promise<Product> {
    const { initialQuantity = 0, ...productFields } = productData;

    // Map category to categoryId for the DB
    const dbPayload: any = {
      ...productFields,
      categoryId: productData.category
    };

    return await Product.sequelize!.transaction(async (transaction) => {
      // Create the product
      const product = await Product.create(dbPayload, { transaction });

      // Create inventory record
      await Inventory.create(
        {
          productId: product.id,
          quantity: initialQuantity,
          reservedQuantity: 0,
          lowStockThreshold: 10,
          trackQuantity: true,
        },
        { transaction }
      );

      return product;
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  async getAllProducts(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{
    products: Product[];
    totalCount: number;
    message?: string;
    success?: boolean;
  }> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price[Op.gte] = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price[Op.lte] = filters.maxPrice;
      }
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Handle full-text search
    let searchCondition: any = {};
    if (filters?.search) {
      searchCondition = {
        [Op.and]: literal(`
          search_vector @@ plainto_tsquery('english', '${this.escapeSearchQuery(
          filters.search
        )}')
        `),
      };
    }

    const finalWhere = { ...where, ...searchCondition };

    const products = await Product.findAll({
      where: finalWhere,
      order: filters?.search
        ? [
          [
            literal(
              `ts_rank_cd(search_vector, plainto_tsquery('english', '${this.escapeSearchQuery(
                filters.search
              )}'))`
            ),
            "DESC",
          ],
        ]
        : [["createdAt", "DESC"]],
    });

    const totalCount = await Product.count({
      where: finalWhere,
    });

    // Add message for empty results
    let message: string | undefined;
    let success: boolean | undefined;
    if (totalCount === 0) {
      success = false;
      if (filters?.search) {
        message = `No products found matching your search criteria: "${filters.search}"`;
      } else if (filters?.category) {
        message = `No products found in category: "${filters.category}"`;
      } else if (Object.keys(filters || {}).length > 0) {
        message = "No products found matching the specified filters";
      } else {
        message = "No products found in the database";
      }
    }

    return { success, products, totalCount, message };
  }

  async fullTextSearch(
    query: string,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      isActive?: boolean;
    }
  ): Promise<{ products: Product[]; totalCount: number; message?: string }> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price[Op.gte] = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price[Op.lte] = filters.maxPrice;
      }
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const searchCondition = {
      [Op.and]: literal(`
        search_vector @@ plainto_tsquery('english', '${this.escapeSearchQuery(
        query
      )}')
      `),
    };

    const finalWhere = { ...where, ...searchCondition };

    const products = await Product.findAll({
      where: finalWhere,
      order: [
        [
          literal(
            `ts_rank_cd(search_vector, plainto_tsquery('english', '${this.escapeSearchQuery(
              query
            )}'))`
          ),
          "DESC",
        ],
        ["createdAt", "DESC"],
      ],
    });

    const totalCount = await Product.count({
      where: finalWhere,
    });

    // Add message for empty search results
    let message: string | undefined;
    if (totalCount === 0) {
      message = `No products found matching your search: "${query}"`;
      if (filters?.category) {
        message += ` in category: "${filters.category}"`;
      }
    }

    return { products, totalCount, message };
  }

  private escapeSearchQuery(query: string): string {
    return query.replace(/'/g, "''").replace(/\\/g, "\\\\");
  }

  async updateProduct(
    id: string,
    updateData: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      imageUrl?: string[];
      isActive?: boolean;
      sku?: string;
    }
  ): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    await product.update(updateData);
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    await product.destroy();
    return true;
  }

  async toggleProductStatus(id: string): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    await product.update({ isActive: !product.isActive });
    return product;
  }

  async getProductsByCategory(
    category: string
  ): Promise<{ products: Product[]; message?: string }> {
    const products = await Product.findAll({
      where: { category, isActive: true },
      order: [["createdAt", "DESC"]],
    });

    let message: string | undefined;
    if (products.length === 0) {
      message = `No active products found in category: "${category}"`;
    }

    return { products, message };
  }
}
