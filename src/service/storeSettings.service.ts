import StoreSettings from "../models/StoreSettings";
import { LogoPosition } from "../enums/LogoPosition";
import { HomepageConfig, Banner } from "../types/storeSettings";
import { getDefaultHomepageConfig } from "../utils/homepage/getDefaultHomepageConfig";
import { v4 as uuidv4 } from "uuid";

export class StoreSettingsService {
  public async getSettings() {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({
        store_name: "My Store",
        tagline: "Welcome to my store",
        logo_url: null,
        logo_width: null,
        logo_position: LogoPosition.LEFT,
      });
    }
    return settings;
  }

  public async updateSettings(data: {
    store_name?: string;
    tagline?: string | null;
    logo_width?: number | null;
    logo_position?: LogoPosition | null;
  }) {
    const settings = await this.getSettings();
    return settings.update(data);
  }

  public async updateLogoUrl(url: string | null) {
    const settings = await this.getSettings();
    return settings.update({ logo_url: url });
  }

  public async updateHomepageConfig(homepageConfig: Partial<HomepageConfig>) {
    const settings = await this.getSettings();
    const currentConfig = settings.homepage || getDefaultHomepageConfig();

    // Automatically generate UUIDs for any banners without IDs
    if (homepageConfig.heroBanners) {
      homepageConfig.heroBanners = homepageConfig.heroBanners.map((banner) => ({
        ...banner,
        id: (banner as any).id || uuidv4(),
      }));
    }
    if (homepageConfig.promotionalBanners) {
      homepageConfig.promotionalBanners = homepageConfig.promotionalBanners.map((banner) => ({
        ...banner,
        id: (banner as any).id || uuidv4(),
      }));
    }

    const newConfig = { ...currentConfig, ...homepageConfig };
    return settings.update({ homepage: newConfig });
  }

  public async getHomepageConfig(): Promise<HomepageConfig> {
    const settings = await this.getSettings();
    return (settings.homepage as HomepageConfig) || getDefaultHomepageConfig();
  }

  public async addHomepageBanner(type: "HERO" | "PROMOTIONAL", banner: Omit<Banner, "id">) {
    const config = await this.getHomepageConfig();
    const newBanner = { ...banner, id: uuidv4() };
    if (type === "HERO") {
      config.heroBanners = [...(config.heroBanners || []), newBanner];
    } else {
      config.promotionalBanners = [...(config.promotionalBanners || []), newBanner];
    }
    return this.updateHomepageConfig(config);
  }

  public async updateHomepageBanner(type: "HERO" | "PROMOTIONAL", id: string, bannerUpdate: Partial<Banner>) {
    const config = await this.getHomepageConfig();
    if (type === "HERO") {
      config.heroBanners = config.heroBanners.map(b => b.id === id ? { ...b, ...bannerUpdate } : b);
    } else {
      config.promotionalBanners = config.promotionalBanners.map(b => b.id === id ? { ...b, ...bannerUpdate } : b);
    }
    return this.updateHomepageConfig(config);
  }

  public async deleteHomepageBanner(type: "HERO" | "PROMOTIONAL", id: string) {
    const config = await this.getHomepageConfig();
    if (type === "HERO") {
      config.heroBanners = config.heroBanners.filter(b => b.id !== id);
    } else {
      config.promotionalBanners = config.promotionalBanners.filter(b => b.id !== id);
    }
    return this.updateHomepageConfig(config);
  }

  public async reorderHomepageBanners(type: "HERO" | "PROMOTIONAL", order: string[]) {
    const config = await this.getHomepageConfig();
    if (type === "HERO") {
      const banners = config.heroBanners || [];
      config.heroBanners = order.map(id => banners.find(b => b.id === id)).filter(Boolean) as Banner[];
      // Keep any that weren't in the order array at the end
      const missing = banners.filter(b => !order.includes(b.id));
      config.heroBanners = [...config.heroBanners, ...missing];
      // Update order index
      config.heroBanners = config.heroBanners.map((b, i) => ({ ...b, order: i }));
    } else {
      const banners = config.promotionalBanners || [];
      config.promotionalBanners = order.map(id => banners.find(b => b.id === id)).filter(Boolean) as Banner[];
      const missing = banners.filter(b => !order.includes(b.id));
      config.promotionalBanners = [...config.promotionalBanners, ...missing];
      config.promotionalBanners = config.promotionalBanners.map((b, i) => ({ ...b, order: i }));
    }
    return this.updateHomepageConfig(config);
  }
}

export const storeSettingsService = new StoreSettingsService();
