import type {
  BrandDocument,
  CartDocument,
  CategoryDocument,
  NotificationDocument,
  OrderDocument,
  ReviewDocument,
  UserDocument,
  WishlistDocument,
} from "@/types";
import { createConverter } from "./generic";

export { createConverter } from "./generic";
export {
  productConverter,
  toProduct,
  toProductDocument,
} from "./product";

export const categoryConverter = createConverter<CategoryDocument>();
export const brandConverter = createConverter<BrandDocument>();
export const userConverter = createConverter<UserDocument>();
export const orderConverter = createConverter<OrderDocument>();
export const cartConverter = createConverter<CartDocument>();
export const wishlistConverter = createConverter<WishlistDocument>();
export const reviewConverter = createConverter<ReviewDocument>();
export const notificationConverter = createConverter<NotificationDocument>();
