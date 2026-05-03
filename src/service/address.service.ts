import "reflect-metadata";
import { Service } from "typedi";
import Address from "../models/Address";
import { Op } from "sequelize";

@Service()
class AddressService {
  async createAddress(userId: number, data: Partial<Address>) {
    const whereClause: any = {
      userId,
      isDeleted: false,
      addressLine1: data.addressLine1,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
    };

    if (data.addressLine2 !== undefined) {
      whereClause.addressLine2 = data.addressLine2;
    }

    if (data.country !== undefined) {
      whereClause.country = data.country;
    }

    const existingAddress = await Address.findOne({
      where: whereClause
    });

    if (existingAddress) {
      throw new Error("This address already exists in your address book.");
    }

    return await Address.create({
      ...data,
      userId,
    });
  }

  async getAddresses(userId: number) {
    return await Address.findAll({
      where: {
        userId,
        isDeleted: false,
      },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
  }

  async getAddressById(id: number, userId: number) {
    const address = await Address.findOne({
      where: {
        id,
        userId,
        isDeleted: false,
      },
    });
    if (!address) {
      throw new Error("Address not found");
    }
    return address;
  }

  async updateAddress(id: number, userId: number, data: Partial<Address>) {
    const address = await this.getAddressById(id, userId);
    // merge address and data
    const finalData = { ...address.toJSON(), ...data };

    const whereClause: any = {
      userId,
      isDeleted: false,
      addressLine1: finalData.addressLine1,
      city: finalData.city,
      state: finalData.state,
      postalCode: finalData.postalCode,
    };

    if (finalData.addressLine2 !== undefined) {
      whereClause.addressLine2 = finalData.addressLine2;
    }

    if (finalData.country !== undefined) {
      whereClause.country = finalData.country;
    }

    // exclude current address id
    const existingAddress = await Address.findOne({
      where: {
        ...whereClause,
        id: { [Op.ne]: id }
      },
    });

    if (existingAddress) {
      throw new Error("This address already exists in your address book.");
    }

    return await address.update(data);
  }

  async deleteAddress(id: number, userId: number) {
    const address = await this.getAddressById(id, userId);
    return await address.update({ isDeleted: true });
  }

  async setDefaultAddress(id: number, userId: number) {
    // Unset current default
    await Address.update(
      { isDefault: false },
      {
        where: { userId, isDefault: true },
      },
    );

    const address = await this.getAddressById(id, userId);
    return await address.update({ isDefault: true });
  }
}

export default AddressService;
