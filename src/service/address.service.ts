import "reflect-metadata";
import { Service } from "typedi";
import Address from "../models/Address";

@Service()
class AddressService {
    async createAddress(userId: number, data: Partial<Address>) {
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
            order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
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
            }
        );

        const address = await this.getAddressById(id, userId);
        return await address.update({ isDefault: true });
    }
}

export default AddressService;
