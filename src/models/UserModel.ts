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
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { UserType } from "../types/user";
import { UserRole } from "../enums/UserRole";

import { HasMany } from "sequelize-typescript";
import Address from "./Address";
import { Optional } from "sequelize";

type UserCreationAttributes = Optional<
  UserType,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "otp"
  | "otpExpiration"
  | "username"
  | "email"
  | "password"
>;
@Table({
  tableName: "users",
  timestamps: true,
})
class User extends Model<UserType, UserCreationAttributes> implements UserType {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  public username?: string;

  @AllowNull(true)
  @Unique
  @Column(DataType.STRING)
  public email?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public password?: string;

  @AllowNull(false)
  @Unique({
    name: "phoneNumber",
    msg: "Phone number already exists.",
  })
  @Column({
    type: DataType.STRING,
    validate: {
      is: /^\+?[0-9]{10,15}$/,
    },
  })
  public phoneNumber!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  public isPhoneVerified!: boolean;

  @Default(UserRole.CUSTOMER)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  public role!: UserRole;

  @AllowNull(true)
  @Column(DataType.STRING)
  public otp?: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  public otpExpiration?: Date | null;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  public readonly updatedAt!: Date;

  @HasMany(() => Address)
  addresses!: Address[];

  @Default("OTP")
  @Column(DataType.ENUM("OTP", "PASSWORD", "BOTH"))
  authType!: "OTP" | "PASSWORD" | "BOTH";
}

export default User;
