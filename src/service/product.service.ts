import { Service } from "typedi";
import { Product } from "../models/Product";
import { Op } from "sequelize";

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
  }): Promise<Product> {
    return await Product.create(productData);
  }

  async getProductById(id: string): Promise<Product | null> {
    return await Product.findByPk(id);
  }

  async getAllProducts(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{ products: Product[]; totalCount: number }> {
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

    if (filters?.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const products = await Product.findAll({ where });
    const totalCount = await Product.count({ where });

    return { products, totalCount };
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
    if (!product) return null;

    await product.update(updateData);
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = await Product.findByPk(id);
    if (!product) return false;

    await product.destroy();
    return true;
  }

  async toggleProductStatus(id: string): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) return null;

    await product.update({ isActive: !product.isActive });
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await Product.findAll({
      where: { category, isActive: true },
      order: [["createdAt", "DESC"]],
    });
  }
}
