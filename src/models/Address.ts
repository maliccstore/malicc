import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from "sequelize-typescript";
import User from "./UserModel";

@Table({
  tableName: "addresses",
  timestamps: true,
})
class Address extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @Index
  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  fullName!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  phoneNumber!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressLine1!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  addressLine2?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  city!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  postalCode!: string;

  @AllowNull(false)
  @Default("IN")
  @Column(DataType.STRING)
  country!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDefault!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDeleted!: boolean; // soft delete, trust me

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default Address;
