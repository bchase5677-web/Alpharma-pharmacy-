export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  availability: "In Stock" | "Out of Stock" | "Requires Prescription";
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Tab = 'home' | 'shop' | 'about' | 'services' | 'categories' | 'equipment' | 'ai-assistant' | 'contact' | 'admin';

export interface Category {
  name: string;
  icon: string; // Lucide icon name
  description: string;
  count: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface WebsiteSettings {
  websiteName: string;
  websiteSubName: string;
  companyFullName: string;
  telephone: string;
  email: string;
  address: string;
  fullAddress: string;
  whatsappNumber: string;
  deliveryFee: number;
  consultationFee: number;
  allowPrescriptionRequires: boolean;
  maintenanceMode: boolean;
  logo?: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  liveVisitors: number;
  totalPageViews: number;
  totalWhatsappClicks: number;
  totalProducts: number;
  totalStockValue: number;
  logs: ActivityLog[];
}
