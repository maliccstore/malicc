import {
  Query,
  Resolver,
  Arg,
  Mutation,
  Authorized,
  Ctx,
  ID,
} from "type-graphql";
import { Service } from "typedi";
import {
  AddressType,
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/address.schema";
import AddressService from "../../../service/address.service";
import { UserToken } from "../../../types/user";
import { UserRole } from "../../../enums/UserRole";

@Service()
@Resolver()
export class AddressResolver {
  constructor(private readonly addressService: AddressService) {}

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Query(() => [AddressType])
  async getUserAddresses(@Ctx() { user }: { user: UserToken }) {
    if (!user) throw new Error("Not authenticated");
    return await this.addressService.getAddresses(user.id);
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CUSTOMER)
  @Query(() => AddressType)
  async getAddress(
    @Ctx() { user }: { user: UserToken },
    @Arg("id", () => ID) id: number,
  ) {
    if (!user) throw new Error("Not authenticated");
    return await this.addressService.getAddressById(id, user.id);
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CUSTOMER)
  @Mutation(() => AddressType)
  async createAddress(
    @Ctx() { user }: { user: UserToken },
    @Arg("input") input: CreateAddressInput,
  ) {
    if (!user) throw new Error("Not authenticated");
    const address = await this.addressService.createAddress(user.id, input);

    // If it's the first address or set as default, handle default logic
    if (input.isDefault) {
      await this.addressService.setDefaultAddress(address.id, user.id);
    }

    return address;
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CUSTOMER)
  @Mutation(() => AddressType)
  async updateAddress(
    @Ctx() { user }: { user: UserToken },
    @Arg("id", () => ID) id: number,
    @Arg("input") input: UpdateAddressInput,
  ) {
    if (!user) throw new Error("Not authenticated");

    if (input.isDefault) {
      await this.addressService.setDefaultAddress(id, user.id);
    }

    return await this.addressService.updateAddress(id, user.id, input);
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CUSTOMER)
  @Mutation(() => Boolean)
  async deleteAddress(
    @Ctx() { user }: { user: UserToken },
    @Arg("id", () => ID) id: number,
  ) {
    if (!user) throw new Error("Not authenticated");
    await this.addressService.deleteAddress(id, user.id);
    return true;
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => AddressType)
  async setDefaultAddress(
    @Ctx() { user }: { user: UserToken },
    @Arg("id", () => ID) id: number,
  ) {
    if (!user) throw new Error("Not authenticated");
    return await this.addressService.setDefaultAddress(id, user.id);
  }
}
