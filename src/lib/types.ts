export type Universe = "ceramic" | "cafe";
export type Availability =
  "available" | "low_stock" | "unavailable" | "seasonal";
export type Role = "owner" | "manager" | "editor" | "viewer";
export interface Category {
  id: string;
  type: Universe;
  slug: string;
  title: string;
  sort_order: number;
  published: boolean;
}
export interface CatalogItem {
  id: string;
  type: Universe;
  category_id: string;
  slug: string;
  name: string;
  short_desc: string;
  long_desc: string;
  price_cents: number;
  status: Availability;
  published: boolean;
  sort_order: number;
  asset: string;
  availability_updated_at?: string;
  ceramic_meta?: {
    dimensions: string;
    difficulty: string;
    estimated_minutes: number | null;
    shape_family: string;
  } | null;
  cafe_meta?: {
    temperature: string;
    caffeine: boolean;
    dietary_tags: string[];
    allergens: string[];
    alcohol_note: string;
  } | null;
  catalog_media?: {
    id: string;
    storage_path: string;
    alt: string;
    sort_order: number;
    width: number;
    height: number;
  }[];
}
export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}
export interface Package {
  id: string;
  slug: string;
  title: string;
  description: string;
  min_people: number;
  max_people: number;
  price_cents: number | null;
  published: boolean;
}
export interface Testimonial {
  id: string;
  name: string;
  handle: string;
  quote: string;
  published: boolean;
}
export interface GalleryEntry {
  media_assets?: { width: number; height: number };
  id: string;
  storage_path: string;
  alt: string;
  caption: string;
  sort_order: number;
  published: boolean;
}
export interface PublicData {
  configured: boolean;
  catalog: CatalogItem[];
  categories: Category[];
  faqs: Faq[];
  packages: Package[];
  testimonials: Testimonial[];
  gallery: GalleryEntry[];
  settings: Record<string, unknown>;
}
export interface Slot {
  id: string;
  starts_at: string;
  ends_at: string;
  remaining: number;
}
export interface ReservationSummary {
  public_code: string;
  name: string;
  starts_at: string;
  ends_at: string;
  party_size: number;
  status: string;
  email_status?: string;
}
export interface Staff {
  id: string;
  display_name: string;
  role: Role;
}
