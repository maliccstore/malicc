import { Service } from "typedi";
import { storeSettingsService } from "./storeSettings.service";
import { ProductService } from "./product.service";
import { Product } from "../models/ProductModel";
import { StorefrontHomepagePayload, HomepageConfig } from "../api/graphql/schemas/homepage.schema";
import { getDefaultHomepageConfig } from "../utils/homepage/getDefaultHomepageConfig";

@Service()
export class HomepageService {
  constructor(
    private readonly productService: ProductService
  ) {}

  public async getHomepageConfig(): Promise<HomepageConfig> {
    const config = await storeSettingsService.getHomepageConfig();
    return config as HomepageConfig;
  }

  private mapProductToSchema(product: Product): any {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.categoryId || "",
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      sku: product.sku,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  public async getStorefrontHomepage(): Promise<StorefrontHomepagePayload> {
    const config = await this.getHomepageConfig();
    
    // Fetch featured products
    let featuredProducts: Product[] = [];
    if (config.featuredProducts?.enabled && config.featuredProducts.productIds?.length > 0) {
      featuredProducts = await this.productService.getProductsByIds(config.featuredProducts.productIds);
    }

    // Fetch top selling products
    let topSellingProducts: Product[] = [];
    if (config.topSelling?.enabled) {
      if (config.topSelling.mode === "MANUAL") {
        topSellingProducts = await this.productService.getManualTopSellingProducts(config.topSelling.productIds);
      } else {
        const limit = config.topSelling.limit || 10;
        const threshold = config.topSelling.minimumThreshold || 5;
        const rankedProducts = await this.productService.getAutoTopSellingProducts(limit);
        
        if (rankedProducts.length < threshold) {
          topSellingProducts = await this.productService.getManualTopSellingProducts(config.topSelling.productIds);
        } else {
          topSellingProducts = rankedProducts;
        }
      }
    }

    // Fetch new arrivals
    let newArrivals: Product[] = [];
    if (config.newArrivals?.enabled) {
      const { products } = await this.productService.getAllProducts({ 
        isActive: true,
      });
      newArrivals = products.slice(0, config.newArrivals.limit || 10);
    }

    return {
      config,
      featuredProducts: featuredProducts.map((p) => this.mapProductToSchema(p)),
      topSellingProducts: topSellingProducts.map((p) => this.mapProductToSchema(p)),
      newArrivals: newArrivals.map((p) => this.mapProductToSchema(p)),
    };
  }
}
