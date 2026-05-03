import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Authorized,
  FieldResolver,
  Root,
} from "type-graphql";
import { Service } from "typedi";
import { CategoryService } from "../../../service/category.service";
import {
  CategorySchema,
  CategoryResponse,
  CategoriesResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryFilterInput,
} from "../schemas/category.schema";
import { UserRole } from "../../../enums/UserRole";
import { Category } from "../../../models/Category";
import { DB_CONSTRAINTS, ERROR_MESSAGES } from "../../../constants/errors";

@Service()
@Resolver(() => CategorySchema)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  private mapToSchema(category: Category): CategorySchema {
    const schema: CategorySchema = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    if (category.children) {
      schema.children = category.children.map((c) => this.mapToSchema(c));
    }

    if (category.parent) {
      schema.parent = this.mapToSchema(category.parent);
    }

    return schema;
  }

  @FieldResolver(() => [CategorySchema], { nullable: true })
  async children(@Root() category: CategorySchema): Promise<CategorySchema[]> {
    if (category.children) return category.children;

    const parentCategory = await Category.findByPk(category.id, {
      include: ["children"],
    });
    if (!parentCategory || !parentCategory.children) {
      return [];
    }
    return parentCategory.children.map((child) => this.mapToSchema(child));
  }

  @FieldResolver(() => CategorySchema, { nullable: true })
  async parent(
    @Root() category: CategorySchema,
  ): Promise<CategorySchema | null> {
    if (category.parent) return category.parent;
    if (!category.parentId) return null;

    const childCategory = await Category.findByPk(category.id, {
      include: ["parent"],
    });
    if (!childCategory || !childCategory.parent) {
      return null;
    }
    return this.mapToSchema(childCategory.parent);
  }

  @Query(() => CategoryResponse)
  async category(@Arg("id") id: string): Promise<CategoryResponse> {
    try {
      const category = await this.categoryService.getCategoryById(id);
      if (!category) {
        return {
          success: false,
          message: "Category not found",
        };
      }
      return {
        success: true,
        message: "Category fetched successfully",
        category: this.mapToSchema(category),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Category not found",
      };
    }
  }

  @Query(() => CategoriesResponse)
  async categories(
    @Arg("filters", { nullable: true }) filters?: CategoryFilterInput,
  ): Promise<CategoriesResponse> {
    try {
      const { categories, totalCount, message } =
        await this.categoryService.getAllCategories(filters);

      return {
        success: true,
        message: message || "Categories fetched successfully",
        categories: categories.map((c) => this.mapToSchema(c)),
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch categories",
        categories: [],
        totalCount: 0,
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => CategoryResponse)
  async createCategory(
    @Arg("input") input: CreateCategoryInput,
  ): Promise<CategoryResponse> {
    try {
      const category = await this.categoryService.createCategory(input);
      return {
        success: true,
        message: "Category created successfully",
        category: this.mapToSchema(category),
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create category",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => CategoryResponse)
  async updateCategory(
    @Arg("id") id: string,
    @Arg("input") input: UpdateCategoryInput,
  ): Promise<CategoryResponse> {
    try {
      const category = await this.categoryService.updateCategory(id, input);
      return {
        success: true,
        message: "Category updated successfully",
        category: category ? this.mapToSchema(category) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update category",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => CategoryResponse)
  async deleteCategory(@Arg("id") id: string): Promise<CategoryResponse> {
    try {
      await this.categoryService.deleteCategory(id);

      return {
        success: true,
        message: "Category deleted successfully",
      };
    } catch (error: any) {
      const msg = error?.message || "";

      // Detect FK constraint via constant
      if (msg.includes(DB_CONSTRAINTS.CATEGORY_IN_USE)) {
        return {
          success: false,
          message: ERROR_MESSAGES.CATEGORY_DELETE_IN_USE,
        };
      }

      return {
        success: false,
        message: msg || "Failed to delete category",
      };
    }
  }
}
