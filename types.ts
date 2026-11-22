export type MenuItem = {
  averageRating?: number;
  reviewCount?: number;
  restaurantAverageRating?: number;
  restaurantReviewCount?: number;
  _id: string;
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  vendorId: string;
  vendorName?: string;
};