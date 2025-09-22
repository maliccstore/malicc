import { Resolver, Query, Mutation, Arg, Authorized } from "type-graphql";
import { ProductService } from "../../../service/product.service";
import {
  Product,
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

@Service()
@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductResponse)
  async product(@Arg("id") id: string): Promise<ProductResponse> {
    try {
      const product = await this.productService.getProductById(id);
      return {
        success: true,
        message: "Product fetched successfully",
        product: product || undefined,
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

      return {
        success: success !== undefined ? success : true,
        message: message || "Products fetched successfully",
        products,
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
      return {
        success: true,
        message: "Product created successfully",
        product,
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
}
