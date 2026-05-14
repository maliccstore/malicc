import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  CreatedAt,
  UpdatedAt,
  Default,
} from "sequelize-typescript";

interface UsageSnapshotAttributes {
  id: number;
  date: string; // 'YYYY-MM-DD'
  storageBytes: string; // BIGINT comes back as string from Postgres
  bandwidthBytes: string;
  whatsappMessages: number;
  ordersCount: number;
  productCount: number;
  syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UsageSnapshot
 *
 * Stores one row per calendar day, capturing billable metrics for this
 * malicc instance. Rows are POSTed to malicc-hq by UsageSyncService.
 * Billing calculations are never performed here.
 */
@Table({
  tableName: "usage_snapshots",
  timestamps: true,
})
export class UsageSnapshot extends Model<UsageSnapshotAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  /**
   * Calendar date this snapshot represents, e.g. '2026-05-14'.
   * Has a UNIQUE constraint — only one row per day.
   */
  @Unique
  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare date: string;

  /**
   * Total bytes stored in public/uploads/ at time of last measurement.
   * Refreshed by a scheduled disk scan, not on every upload.
   */
  @Default(0)
  @Column(DataType.BIGINT)
  declare storageBytes: string;

  /**
   * Estimated bytes served as HTTP responses during this day.
   * Accumulated via the requestSniffer middleware (Content-Length).
   */
  @Default(0)
  @Column(DataType.BIGINT)
  declare bandwidthBytes: string;

  /**
   * Number of WhatsApp template messages successfully delivered today.
   */
  @Default(0)
  @Column(DataType.INTEGER)
  declare whatsappMessages: number;

  /**
   * Number of orders that transitioned to PAID status today.
   */
  @Default(0)
  @Column(DataType.INTEGER)
  declare ordersCount: number;

  /**
   * Total active product count at the time of the last snapshot flush.
   */
  @Default(0)
  @Column(DataType.INTEGER)
  declare productCount: number;

  /**
   * Set when this snapshot has been successfully acknowledged by malicc-hq.
   * NULL means "pending sync".
   */
  @AllowNull(true)
  @Column(DataType.DATE)
  declare syncedAt: Date | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare readonly createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare readonly updatedAt: Date;
}
