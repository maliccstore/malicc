import {
  ObjectType,
  Field,
  InputType,
  Int,
  registerEnumType,
} from "type-graphql";
import { ProductSchema as Product } from "./product.schema";
import { HomepageProductMode, HomepageBannerType } from "../../../enums/Homepage";



registerEnumType(HomepageProductMode, {
  name: "HomepageProductMode",
  description: "Mode for selecting products on the homepage",
});

registerEnumType(HomepageBannerType, {
  name: "HomepageBannerType",
  description: "Type of the homepage banner",
});

@ObjectType()
export class Banner {
  @Field()
  id!: string;

  @Field()
  image!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field({ nullable: true })
  ctaText?: string;

  @Field({ nullable: true })
  redirectUrl?: string;

  @Field()
  active!: boolean;

  @Field(() => Int)
  order!: number;
}

@ObjectType()
export class FeaturedProductsConfig {
  @Field(() => [String])
  productIds!: string[];

  @Field()
  enabled!: boolean;
}

@ObjectType()
export class TopSellingConfig {
  @Field(() => HomepageProductMode)
  mode!: HomepageProductMode;

  @Field(() => [String])
  productIds!: string[];

  @Field(() => Int)
  limit!: number;

  @Field()
  enabled!: boolean;

  @Field(() => Int)
  minimumThreshold!: number;
}

@ObjectType()
export class NewArrivalsConfig {
  @Field()
  enabled!: boolean;

  @Field(() => Int)
  limit!: number;
}

@ObjectType()
export class HomepageConfig {
  @Field(() => [Banner])
  heroBanners!: Banner[];

  @Field(() => FeaturedProductsConfig)
  featuredProducts!: FeaturedProductsConfig;

  @Field(() => TopSellingConfig)
  topSelling!: TopSellingConfig;

  @Field(() => [Banner])
  promotionalBanners!: Banner[];

  @Field(() => NewArrivalsConfig)
  newArrivals!: NewArrivalsConfig;

  @Field(() => [String])
  sectionOrder!: string[];
}

@ObjectType()
export class StorefrontHomepagePayload {
  @Field(() => HomepageConfig)
  config!: HomepageConfig;

  @Field(() => [Product])
  featuredProducts!: Product[];

  @Field(() => [Product])
  topSellingProducts!: Product[];

  @Field(() => [Product])
  newArrivals!: Product[];
}

@InputType()
export class BannerInput {
  @Field()
  image!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field({ nullable: true })
  ctaText?: string;

  @Field({ nullable: true })
  redirectUrl?: string;

  @Field()
  active!: boolean;

  @Field(() => Int)
  order!: number;
}

@InputType()
export class FeaturedProductsInput {
  @Field(() => [String])
  productIds!: string[];

  @Field()
  enabled!: boolean;
}

@InputType()
export class TopSellingInput {
  @Field(() => HomepageProductMode)
  mode!: HomepageProductMode;

  @Field(() => [String])
  productIds!: string[];

  @Field(() => Int)
  limit!: number;

  @Field()
  enabled!: boolean;

  @Field(() => Int)
  minimumThreshold!: number;
}

@InputType()
export class NewArrivalsInput {
  @Field()
  enabled!: boolean;

  @Field(() => Int)
  limit!: number;
}

@InputType()
export class HomepageConfigInput {
  @Field(() => [BannerInput])
  heroBanners!: BannerInput[];

  @Field(() => FeaturedProductsInput)
  featuredProducts!: FeaturedProductsInput;

  @Field(() => TopSellingInput)
  topSelling!: TopSellingInput;

  @Field(() => [BannerInput])
  promotionalBanners!: BannerInput[];

  @Field(() => NewArrivalsInput)
  newArrivals!: NewArrivalsInput;

  @Field(() => [String])
  sectionOrder!: string[];
}
