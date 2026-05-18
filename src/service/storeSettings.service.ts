import StoreSettings from "../models/StoreSettings";
import { LogoPosition } from "../enums/LogoPosition";

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
}

export const storeSettingsService = new StoreSettingsService();
