import { collection, doc } from "firebase/firestore";
import { COLLECTIONS } from "@/constants/collections";
import {
  brandConverter,
  cartConverter,
  categoryConverter,
  notificationConverter,
  orderConverter,
  productConverter,
  reviewConverter,
  userConverter,
  wishlistConverter,
} from "./converters";
import { getDb } from "./firestore";

export const productsCollection = () =>
  collection(getDb(), COLLECTIONS.products).withConverter(productConverter);

export const productDoc = (id: string) =>
  doc(getDb(), COLLECTIONS.products, id).withConverter(productConverter);

export const categoriesCollection = () =>
  collection(getDb(), COLLECTIONS.categories).withConverter(categoryConverter);

export const categoryDoc = (id: string) =>
  doc(getDb(), COLLECTIONS.categories, id).withConverter(categoryConverter);

export const brandsCollection = () =>
  collection(getDb(), COLLECTIONS.brands).withConverter(brandConverter);

export const brandDoc = (id: string) =>
  doc(getDb(), COLLECTIONS.brands, id).withConverter(brandConverter);

export const usersCollection = () =>
  collection(getDb(), COLLECTIONS.users).withConverter(userConverter);

export const userDoc = (uid: string) =>
  doc(getDb(), COLLECTIONS.users, uid).withConverter(userConverter);

export const ordersCollection = () =>
  collection(getDb(), COLLECTIONS.orders).withConverter(orderConverter);

export const cartDoc = (uid: string) =>
  doc(getDb(), COLLECTIONS.carts, uid).withConverter(cartConverter);

export const wishlistDoc = (uid: string) =>
  doc(getDb(), COLLECTIONS.wishlists, uid).withConverter(wishlistConverter);

export const reviewsCollection = () =>
  collection(getDb(), COLLECTIONS.reviews).withConverter(reviewConverter);

export const notificationsCollection = () =>
  collection(getDb(), COLLECTIONS.notifications).withConverter(
    notificationConverter,
  );
