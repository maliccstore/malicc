import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  Default,
} from "sequelize-typescript";
import { Optional } from "sequelize";

import { StoreSettingsType } from "../types/storeSettings";
import { LogoPosition } from "../enums/LogoPosition";

type StoreSettingsCreationAttributes = Optional<
  StoreSettingsType,
  "id" | "createdAt" | "updatedAt" | "tagline" | "logo_url" | "logo_width" | "logo_position"
>;

@Table({
  tableName: "store_settings",
  timestamps: true,
})
class StoreSettings extends Model<StoreSettingsType, StoreSettingsCreationAttributes> implements StoreSettingsType {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  public id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public store_name!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public tagline?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  public logo_url?: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  public logo_width?: number | null;

  @AllowNull(true)
  @Column(DataType.ENUM(...Object.values(LogoPosition)))
  public logo_position?: LogoPosition | null;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  public readonly updatedAt!: Date;
}

export default StoreSettings;
