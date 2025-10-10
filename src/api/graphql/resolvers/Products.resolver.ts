import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Authorized,
  FieldResolver,
  Root,
} from "type-graphql";
import { ProductService } from "../../../service/product.service";
import {
  ProductSchema,
  ProductResponse,
  ProductsResponse,
} from "../schemas/product.schema";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
} from "../inputs/ProductInput";
import { Service } from "typedi";
import { UserRole } from "../../../enums/UserRole";
import { Inventory } from "../../../models/Inventory";
import { InventorySchema } from "../schemas/inventory.schema";
import { Product as ProductModel } from "../../../models/ProductModel";
@Service()
@Resolver(() => ProductSchema)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @FieldResolver(() => InventorySchema, { nullable: true })
  async inventory(@Root() productSchema: ProductSchema) {
    const productModel = await ProductModel.findByPk(productSchema.id, {
      include: [Inventory],
    });

    if (!productModel || !productModel.inventory) {
      return null;
    }

    const inventory = productModel.inventory;
    return {
      id: inventory.id,
      productId: inventory.productId,
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: inventory.availableQuantity,
      isInStock: inventory.isInStock(),
      lowStockThreshold: inventory.lowStockThreshold,
      trackQuantity: inventory.trackQuantity,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
    };
  }

  @FieldResolver(() => Boolean)
  async inStock(@Root() productSchema: ProductSchema): Promise<boolean> {
    const productModel = await ProductModel.findByPk(productSchema.id, {
      include: [Inventory],
    });
    if (!productModel) return false;

    return await productModel.checkStock(1);
  }

  @FieldResolver(() => Number)
  async availableQuantity(
    @Root() productSchema: ProductSchema
  ): Promise<number> {
    const productModel = await ProductModel.findByPk(productSchema.id, {
      include: [Inventory],
    });

    if (!productModel) return 0;

    return await productModel.getAvailableQuantity();
  }

  @Query(() => ProductResponse)
  async product(@Arg("id") id: string): Promise<ProductResponse> {
    try {
      const product = await this.productService.getProductById(id);
      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }
      const productSchema: ProductSchema = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        sku: product.sku,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // inventory, inStock, availableQuantity will be populated by field resolvers
      };
      return {
        success: true,
        message: "Product fetched successfully",
        product: productSchema,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Product not found",
      };
    }
  }

  @Query(() => ProductsResponse)
  async products(
    @Arg("filters", { nullable: true }) filters?: ProductFilterInput
  ): Promise<ProductsResponse> {
    try {
      const { products, totalCount, message, success } =
        await this.productService.getAllProducts(filters);

      const productSchemas: ProductSchema[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        sku: product.sku,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
      return {
        success: success !== undefined ? success : true,
        message: message || "Products fetched successfully",
        products: productSchemas,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch products. Error: ${error}`,
        products: [],
        totalCount: 0,
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => ProductResponse)
  async createProduct(
    @Arg("input") input: CreateProductInput
  ): Promise<ProductResponse> {
    try {
      const product = await this.productService.createProduct(input);

      const productSchema: ProductSchema = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        sku: product.sku,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
      return {
        success: true,
        message: "Product created successfully",
        product: productSchema,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create product. Error: ${error}`,
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => ProductResponse)
  async updateProduct(
    @Arg("id") id: string,
    @Arg("input") input: UpdateProductInput
  ): Promise<ProductResponse> {
    try {
      const product = await this.productService.updateProduct(id, input);
      return {
        success: true,
        message: "Product updated successfully",
        product: product || undefined,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update product",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => ProductResponse)
  async deleteProduct(@Arg("id") id: string): Promise<ProductResponse> {
    try {
      const success = await this.productService.deleteProduct(id);
      return {
        success: true,
        message: "Product deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete product",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => ProductResponse)
  async toggleProductStatus(@Arg("id") id: string): Promise<ProductResponse> {
    try {
      const product = await this.productService.toggleProductStatus(id);
      return {
        success: true,
        message: `Product ${
          product?.isActive ? "activated" : "deactivated"
        } successfully`,
        product: product || undefined,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to toggle product status",
      };
    }
  }

  @Query(() => ProductsResponse)
  async productsByCategory(
    @Arg("category") category: string
  ): Promise<ProductsResponse> {
    try {
      const { products, message } =
        await this.productService.getProductsByCategory(category);

      return {
        success: true,
        message:
          message || `Products in category "${category}" fetched successfully`,
        products,
        totalCount: products.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch products by category. Error: ${error}`,
        products: [],
        totalCount: 0,
      };
    }
  }

  @Query(() => ProductsResponse)
  async searchProducts(
    @Arg("query") query: string,
    @Arg("filters", { nullable: true }) filters?: ProductFilterInput
  ): Promise<ProductsResponse> {
    try {
      const { products, totalCount, message } =
        await this.productService.fullTextSearch(query, filters);

      return {
        success: true,
        message: message || "Products searched successfully",
        products,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to search products. Error: ${error}`,
        products: [],
        totalCount: 0,
      };
    }
  }

  @Authorized([UserRole.ADMIN, UserRole.SUPERADMIN])
  @Mutation(() => ProductResponse)
  async updateInventory(
    @Arg("productId") productId: string,
    @Arg("quantity") quantity: number
  ): Promise<ProductResponse> {
    try {
      let inventory = await Inventory.findOne({ where: { productId } });

      if (!inventory) {
        // Create inventory record if it doesn't exist
        inventory = await Inventory.create({
          productId,
          quantity,
          reservedQuantity: 0,
        });
      } else {
        inventory.quantity = quantity;
        await inventory.save();
      }

      const product = await this.productService.getProductById(productId);

      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      const productSchema: ProductSchema = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        sku: product.sku,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

      return {
        success: true,
        message: "Inventory updated successfully",
        product: productSchema,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update inventory. Error: ${error}`,
      };
    }
  }

  @Authorized([UserRole.ADMIN, UserRole.SUPERADMIN])
  @Mutation(() => ProductResponse)
  async restockProduct(
    @Arg("productId") productId: string,
    @Arg("quantity") quantity: number
  ): Promise<ProductResponse> {
    try {
      const inventory = await Inventory.findOne({ where: { productId } });

      if (!inventory) {
        throw new Error("Inventory record not found");
      }

      await inventory.restock(quantity);

      const product = await this.productService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      const productSchema: ProductSchema = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        sku: product.sku,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

      return {
        success: true,
        message: `Restocked ${quantity} items successfully`,
        product: productSchema,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restock product. Error: ${error}`,
      };
    }
  }
}
