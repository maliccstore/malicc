import { HomepageConfig } from "../../types/storeSettings";

export const getDefaultHomepageConfig = (): HomepageConfig => {
  return {
    heroBanners: [],
    promotionalBanners: [],
    featuredProducts: {
      productIds: [],
      enabled: true,
    },
    topSelling: {
      mode: "AUTO",
      productIds: [],
      limit: 10,
      enabled: true,
      minimumThreshold: 5,
    },
    newArrivals: {
      enabled: true,
      limit: 10,
    },
    sectionOrder: ["hero", "featured", "topSelling", "promotional", "newArrivals"],
  };
};
