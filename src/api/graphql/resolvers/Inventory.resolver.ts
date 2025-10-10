// src/api/graphql/resolvers/Inventory.resolver.ts
import { Resolver, Mutation, Arg, Authorized, Query, Int } from "type-graphql";
import { Inventory } from "../../../models/Inventory";
import { InventorySchema } from "../schemas/inventory.schema";
import { UserRole } from "../../../enums/UserRole";
import { Service } from "typedi";

@Service()
@Resolver()
export class InventoryResolver {
  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Query(() => [InventorySchema], { nullable: true })
  async getInventory(): Promise<Inventory[] | null> {
    return Inventory.findAll();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => InventorySchema)
  async updateInventory(
    @Arg("productId") productId: string,
    @Arg("quantity", () => Int) quantity: number
  ): Promise<Inventory> {
    let inventory = await Inventory.findOne({ where: { productId } });

    if (!inventory) {
      // Create inventory record if it doesn't exist
      inventory = await Inventory.create({
        productId,
        quantity,
        reservedQuantity: 0,
      });
    } else {
      inventory.quantity = quantity;
      await inventory.save();
    }

    return inventory;
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => InventorySchema)
  async restockInventory(
    @Arg("productId") productId: string,
    @Arg("quantity") quantity: number
  ): Promise<Inventory> {
    const inventory = await Inventory.findOne({ where: { productId } });

    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    await inventory.restock(quantity);
    return inventory;
  }
}
