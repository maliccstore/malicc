import { Table, Column, Model, DataType, Default, CreatedAt, UpdatedAt } from "sequelize-typescript";
import { EventSyncStatus } from "../enums/Events";

@Table({
  tableName: "events",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class Event extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  event!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  store_id?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  session_id?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  payload?: Record<string, any>;


  @Default(EventSyncStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(EventSyncStatus)),
    allowNull: false,
  })
  sync_status!: EventSyncStatus;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  retry_count!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  last_error?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updated_at!: Date;
}

