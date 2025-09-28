import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  Default,
  AllowNull,
} from "sequelize-typescript";

@Table({
  tableName: "sessions",
  timestamps: true,
  indexes: [
    {
      name: "sessions_session_id_index",
      fields: ["sessionId"],
    },
    {
      name: "sessions_user_id_index",
      fields: ["userId"],
    },
    {
      name: "sessions_guest_id_index",
      fields: ["guestId"],
    },
    {
      name: "sessions_expires_at_index",
      fields: ["expiresAt"],
    },
  ],
})
export class Session extends Model {
  @Index("sessions_session_id_index")
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false,
  })
  sessionId!: string;

  @Index("sessions_user_id_index")
  @AllowNull(true)
  @Column(DataType.STRING)
  userId?: string;

  @Index("sessions_guest_id_index")
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  guestId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  userRole!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiresAt!: Date;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  lastAccessed!: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  userAgent?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  ipAddress?: string;

  // Helper method to check if session is expired
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper method to extend session
  extendSession(durationMs: number = 30 * 60 * 1000): void {
    this.expiresAt = new Date(Date.now() + durationMs);
    this.lastAccessed = new Date();
  }
}
