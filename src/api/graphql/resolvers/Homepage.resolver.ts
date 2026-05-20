import { Resolver, Query, Mutation, Arg, Authorized, Int } from "type-graphql";
import { Service } from "typedi";
import { UserRole } from "../../../enums/UserRole";
import { storeSettingsService } from "../../../service/storeSettings.service";
import { HomepageService } from "../../../service/homepage.service";
import {
  HomepageConfig,
  StorefrontHomepagePayload,
  HomepageConfigInput,
  BannerInput,
} from "../schemas/homepage.schema";
import { HomepageProductMode, HomepageBannerType } from "../../../enums/Homepage";

@Service()
@Resolver()
export class HomepageResolver {
  constructor(private readonly homepageService: HomepageService) { }

  @Query(() => HomepageConfig)
  async getHomepageConfig(): Promise<HomepageConfig> {
    return await this.homepageService.getHomepageConfig();
  }

  @Query(() => StorefrontHomepagePayload)
  async getStorefrontHomepage(): Promise<StorefrontHomepagePayload> {
    return await this.homepageService.getStorefrontHomepage();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => HomepageConfig)
  async updateHomepageConfig(
    @Arg("input", () => HomepageConfigInput) input: HomepageConfigInput
  ): Promise<HomepageConfig> {
    await storeSettingsService.updateHomepageConfig(input as any);
    return await this.homepageService.getHomepageConfig();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => HomepageConfig)
  async updateTopSellingConfig(
    @Arg("mode", () => HomepageProductMode) mode: HomepageProductMode,
    @Arg("productIds", () => [String]) productIds: string[],
    @Arg("limit", () => Int) limit: number,
    @Arg("enabled") enabled: boolean,
    @Arg("minimumThreshold", () => Int) minimumThreshold: number
  ): Promise<HomepageConfig> {
    const config = await this.homepageService.getHomepageConfig();
    config.topSelling = {
      mode,
      productIds,
      limit,
      enabled,
      minimumThreshold,
    };
    await storeSettingsService.updateHomepageConfig({ topSelling: config.topSelling });
    return await this.homepageService.getHomepageConfig();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => HomepageConfig)
  async addHomepageBanner(
    @Arg("type", () => HomepageBannerType) type: HomepageBannerType,
    @Arg("input", () => BannerInput) input: BannerInput
  ): Promise<HomepageConfig> {
    await storeSettingsService.addHomepageBanner(type, input);
    return await this.homepageService.getHomepageConfig();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => HomepageConfig)
  async updateHomepageBanner(
    @Arg("type", () => HomepageBannerType) type: HomepageBannerType,
    @Arg("id") id: string,
    @Arg("input", () => BannerInput) input: BannerInput
  ): Promise<HomepageConfig> {
    await storeSettingsService.updateHomepageBanner(type, id, input);
    return await this.homepageService.getHomepageConfig();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => HomepageConfig)
  async deleteHomepageBanner(
    @Arg("type", () => HomepageBannerType) type: HomepageBannerType,
    @Arg("id") id: string
  ): Promise<HomepageConfig> {
    await storeSettingsService.deleteHomepageBanner(type, id);
    return await this.homepageService.getHomepageConfig();
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => HomepageConfig)
  async reorderHomepageBanners(
    @Arg("type", () => HomepageBannerType) type: HomepageBannerType,
    @Arg("order", () => [String]) order: string[]
  ): Promise<HomepageConfig> {
    await storeSettingsService.reorderHomepageBanners(type, order);
    return await this.homepageService.getHomepageConfig();
  }
}
