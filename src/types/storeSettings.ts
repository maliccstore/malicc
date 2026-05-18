import { LogoPosition } from "../enums/LogoPosition";

export interface StoreSettingsType {
  id: string;
  store_name: string;
  tagline?: string | null;
  logo_url?: string | null;
  logo_width?: number | null;
  logo_position?: LogoPosition | null;
  createdAt: Date;
  updatedAt: Date;
}
