import { registerEnumType } from "type-graphql";

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

// Register the enum with TypeGraphQL
registerEnumType(DiscountType, {
  name: "DiscountType",
});
