import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { UserType } from "../types/user";

@Table({
  tableName: "users",
  timestamps: true,
})
class User extends Model<UserType> implements UserType {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id!: number; // Changed from string to number since it's autoIncrement

  @AllowNull(false)
  @Column(DataType.STRING)
  public username!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  public email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public password!: string;

  @AllowNull(false)
  @Unique
  @Column({
    type: DataType.STRING,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/, // E.164 format
    },
  })
  public phoneNumber!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  public isPhoneVerified!: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  public otp?: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  public otpExpiration?: Date | null;

  @Column(DataType.DATE)
  public readonly createdAt!: Date;

  @Column(DataType.DATE)
  public readonly updatedAt!: Date;
}

export default User;
