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

@Table({
  tableName: "users",
  timestamps: true,
})
class User extends Model<UserType> implements UserType {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  public username!: string;

  @AllowNull(true)
  @Unique
  @Column(DataType.STRING)
  public email!: string;

  @AllowNull(false)
  @Unique
  @Column({
    type: DataType.STRING,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/,
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
}

export default User;
