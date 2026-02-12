import { Service } from "typedi";
import { Category } from "../models/Category";
import { Op } from "sequelize";

@Service()
export class CategoryService {
    async createCategory(data: {
        name: string;
        slug: string;
        description?: string;
        parentId?: string;
        isActive?: boolean;
        sortOrder?: number;
    }): Promise<Category> {
        const existingCategory = await Category.findOne({
            where: {
                [Op.or]: [{ name: data.name }, { slug: data.slug }],
            },
        });

        if (existingCategory) {
            throw new Error("Category with this name or slug already exists");
        }

        return await Category.create(data as any);
    }

    async getCategoryById(id: string): Promise<Category | null> {
        const category = await Category.findByPk(id, {
            include: ["children", "parent"],
        });
        if (!category) {
            throw new Error(`Category with ID ${id} not found`);
        }
        return category;
    }

    async getAllCategories(filters?: {
        isActive?: boolean;
        search?: string;
        parentId?: string | null; // Use null to specifically fetch root categories
    }): Promise<{
        categories: Category[];
        totalCount: number;
        message?: string;
    }> {
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.parentId !== undefined) {
            where.parentId = filters.parentId;
        }

        if (filters?.search) {
            where.name = { [Op.iLike]: `%${filters.search}%` };
        }

        const categories = await Category.findAll({
            where,
            order: [["sortOrder", "ASC"], ["name", "ASC"]],
            include: ["children"],
        });

        const totalCount = await Category.count({ where });

        let message: string | undefined;
        if (categories.length === 0) {
            message = "No categories found";
        }

        return { categories, totalCount, message };
    }

    async updateCategory(
        id: string,
        updateData: {
            name?: string;
            slug?: string;
            description?: string;
            parentId?: string | null;
            isActive?: boolean;
            sortOrder?: number;
        }
    ): Promise<Category | null> {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error(`Category with ID ${id} not found`);
        }

        // specific check to avoid cycles if updating parentId
        if (updateData.parentId && updateData.parentId === id) {
            throw new Error("Category cannot be its own parent");
        }

        await category.update(updateData as any);
        return category;
    }

    async deleteCategory(id: string): Promise<boolean> {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error(`Category with ID ${id} not found`);
        }

        await category.destroy();
        return true;
    }
}
