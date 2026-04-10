import { Table, Column, Model, DataType, Default } from "sequelize-typescript";

@Table({
  tableName: "events",
  timestamps: false,
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
    type: DataType.UUID,
    allowNull: true,
  })
  user_id?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  session_id!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
