import { Resolver, Query, Mutation, Arg, Args, Authorized } from "type-graphql";
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

@Service()
@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => Product, { nullable: true })
  async product(@Arg("id") id: string): Promise<Product | null> {
    return await this.productService.getProductById(id);
  }

  @Query(() => ProductsResponse)
  async products(
    @Arg("filters", { nullable: true }) filters?: ProductFilterInput
  ): Promise<ProductsResponse> {
    try {
      const { products, totalCount } = await this.productService.getAllProducts(
        filters
      );
      return {
        success: true,
        message: "Products fetched successfully",
        products,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch products \n Error: ${error}`,
        products: [],
        totalCount: 0,
      };
    }
  }

  @Authorized()
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
        message: `Failed to create product \n ${error}`,
      };
    }
  }

  @Authorized()
  @Mutation(() => ProductResponse)
  async updateProduct(
    @Arg("id") id: string,
    @Arg("input") input: UpdateProductInput
  ): Promise<ProductResponse> {
    try {
      const product = await this.productService.updateProduct(id, input);
      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }
      return {
        success: true,
        message: "Product updated successfully",
        product,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update product",
      };
    }
  }

  @Authorized()
  @Mutation(() => ProductResponse)
  async deleteProduct(@Arg("id") id: string): Promise<ProductResponse> {
    try {
      const success = await this.productService.deleteProduct(id);
      if (!success) {
        return {
          success: false,
          message: "Product not found",
        };
      }
      return {
        success: true,
        message: "Product deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete product",
      };
    }
  }

  @Authorized()
  @Mutation(() => ProductResponse)
  async toggleProductStatus(@Arg("id") id: string): Promise<ProductResponse> {
    try {
      const product = await this.productService.toggleProductStatus(id);
      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }
      return {
        success: true,
        message: `Product ${
          product.isActive ? "activated" : "deactivated"
        } successfully`,
        product,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to toggle product status",
      };
    }
  }

  @Query(() => [Product])
  async productsByCategory(
    @Arg("category") category: string
  ): Promise<Product[]> {
    return await this.productService.getProductsByCategory(category);
  }
}
