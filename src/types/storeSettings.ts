import { LogoPosition } from "../enums/LogoPosition";

export interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  redirectUrl?: string;
  active: boolean;
  order: number;
}

export interface FeaturedProducts {
  productIds: string[];
  enabled: boolean;
}

export interface TopSelling {
  mode: "AUTO" | "MANUAL";
  productIds: string[];
  limit: number;
  enabled: boolean;
  minimumThreshold: number;
}

export interface NewArrivals {
  enabled: boolean;
  limit: number;
}

export interface HomepageConfig {
  heroBanners: Banner[];
  featuredProducts: FeaturedProducts;
  topSelling: TopSelling;
  promotionalBanners: Banner[];
  newArrivals: NewArrivals;
  sectionOrder: string[];
}

export interface StoreSettingsType {
  id: string;
  store_name: string;
  tagline?: string | null;
  logo_url?: string | null;
  logo_width?: number | null;
  logo_position?: LogoPosition | null;
  homepage?: HomepageConfig | null;
  createdAt: Date;
  updatedAt: Date;
}
