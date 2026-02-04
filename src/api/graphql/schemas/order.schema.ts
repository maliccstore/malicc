import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
  Int,
} from "type-graphql";
import { OrderStatus } from "../../../enums/OrderStatus";
import { Currency } from "../../../enums/Currency";

import { FulfillmentStatus } from "../../../enums/FulfillmentStatus";

registerEnumType(OrderStatus, {
  name: "OrderStatus",
  description: "Status of the order",
});

registerEnumType(Currency, {
  name: "Currency",
  description: "Currency used for the order",
});

registerEnumType(FulfillmentStatus, {
  name: "FulfillmentStatus",
  description: "Physical fulfillment lifecycle of an order",
});
@ObjectType()
export class AddressSnapshotSchema {
  @Field()
  fullName!: string;

  @Field()
  phoneNumber!: string;

  @Field()
  addressLine1!: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field()
  city!: string;

  @Field()
  state!: string;

  @Field()
  postalCode!: string;

  @Field()
  country!: string;
}

@ObjectType()
export class OrderItemSchema {
  @Field(() => ID)
  id!: string;

  @Field()
  productId!: string;

  @Field()
  productName!: string;

  @Field(() => Float)
  unitPrice!: number;

  @Field()
  quantity!: number;

  @Field(() => Float)
  totalPrice!: number;
}

@ObjectType()
export class OrderSchema {
  @Field(() => ID)
  id!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => Float)
  subtotal!: number;

  @Field(() => Float)
  tax!: number;

  @Field(() => Float)
  shippingFee!: number;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Currency)
  currency!: Currency;

  @Field(() => [OrderItemSchema])
  items!: OrderItemSchema[];

  @Field(() => AddressSnapshotSchema, { nullable: true })
  shippingAddress?: AddressSnapshotSchema;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  shippingMethod?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class OrderResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => OrderSchema, { nullable: true })
  order?: OrderSchema;
}

@ObjectType()
export class OrdersResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [OrderSchema])
  orders!: OrderSchema[];

  @Field(() => Int, { nullable: true })
  totalCount?: number;
}
