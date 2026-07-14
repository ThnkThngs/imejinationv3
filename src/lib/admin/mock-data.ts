// Types mirroring the Supabase schema. Kept in this path so existing imports
// keep working after the localStorage → Supabase migration.

export type LeadStatus = "New" | "In Review" | "Contacted" | "Won" | "Lost" | "Archived";
export type BriefStatus = "New" | "Reviewed" | "Quoted" | "Won" | "Lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
}

export interface Brief {
  id: string;
  client_name: string;
  email: string;
  project_type: string;
  budget_range: string;
  timeline: string;
  location: string;
  deliverables: string;
  details: string;
  ai_recommendation: string;
  status: BriefStatus;
  created_at: string;
}

export interface MediaItem {
  url: string;
  type: "image" | "video";
  name?: string;
  poster?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  description: string | null;
  cover_image: string | null;
  gallery_images: string[];
  media: MediaItem[];
  published: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  published: boolean;
  display_order: number;
}

export interface HomepageStat {
  label: string;
  value: string;
}

export interface HomepageContent {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_video: string;
  hero_cta: string;
  about_text: string;
  statistics: HomepageStat[];
}

export const emptyHomepage: HomepageContent = {
  id: "",
  hero_title: "",
  hero_subtitle: "",
  hero_video: "",
  hero_cta: "",
  about_text: "",
  statistics: [],
};
