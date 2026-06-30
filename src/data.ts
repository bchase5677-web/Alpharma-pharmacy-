import { Product, Category, Testimonial } from "./types";

export const CATEGORIES: Category[] = [
  {
    name: "Prescription Medicines",
    icon: "Pill",
    description: "Anti-infectives, cardiovascular, anti-diabetic, and custom clinical medications.",
    count: 145
  },
  {
    name: "Over-the-Counter Medicines",
    icon: "Stethoscope",
    description: "Analgesics, cough & cold relief, allergy medicines, and digestive care.",
    count: 220
  },
  {
    name: "Medical Equipment",
    icon: "Activity",
    description: "Oxygen concentrators, nebulizers, diagnostic devices, and clinical equipment.",
    count: 85
  },
  {
    name: "Baby & Mother Care",
    icon: "Baby",
    description: "Infant nutrition, baby hygiene, maternity supplies, and mother care wellness.",
    count: 95
  },
  {
    name: "Vitamins & Supplements",
    icon: "Sparkles",
    description: "Multivitamins, immune support, calcium formulations, and herbal supplements.",
    count: 130
  },
  {
    name: "Personal Care",
    icon: "Heart",
    description: "Dermatological skincare, oral care, hand sanitizers, and antiseptic solutions.",
    count: 110
  },
  {
    name: "Diabetes Care",
    icon: "Droplet",
    description: "Glucometers, test strips, lancets, insulin syringes, and diabetic nutrition.",
    count: 45
  },
  {
    name: "Blood Pressure Monitors",
    icon: "HeartPulse",
    description: "Automatic digital upper-arm monitors, wrist monitors, and manual cuffs.",
    count: 32
  },
  {
    name: "First Aid",
    icon: "Briefcase",
    description: "Bandages, surgical tapes, antiseptic liquids, cotton wool, and complete emergency kits.",
    count: 60
  },
  {
    name: "Hospital Supplies",
    icon: "Building",
    description: "Syringes, disposable gloves, clinical sheets, catheters, and infusion sets.",
    count: 180
  },
  {
    name: "Surgical Equipment",
    icon: "Scissors",
    description: "Scalpels, forceps, surgical sutures, clamps, and autoclave accessories.",
    count: 40
  },
  {
    name: "Health & Wellness",
    icon: "Smile",
    description: "Weight management, fitness trackers, aromatherapy, and organic healthy teas.",
    count: 75
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Paracetamol 500mg Tablets",
    category: "Over-the-Counter Medicines",
    price: 650,
    description: "Effective relief from mild to moderate pain including headache, toothache, and menstrual pains. Helps reduce fever.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 124
  },
  {
    id: "2",
    name: "Amoxicillin 500mg Capsules",
    category: "Prescription Medicines",
    price: 2200,
    description: "Broad-spectrum antibiotic used to treat bacterial infections such as respiratory tract infections, dental infections, and UTIs. Prescription required.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    availability: "Requires Prescription",
    rating: 4.6,
    reviewsCount: 88
  },
  {
    id: "3",
    name: "Omeprazole 20mg Capsules",
    category: "Prescription Medicines",
    price: 1500,
    description: "Proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach. Used to treat acid reflux, peptic ulcers, and GERD.",
    image: "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 54
  },
  {
    id: "4",
    name: "Digital Blood Pressure Monitor",
    category: "Blood Pressure Monitors",
    price: 24500,
    description: "Premium fully-automatic upper arm blood pressure monitor. Features intelligent wrapping detection, arrhythmia alert, and 90-record memory capacity.",
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 42
  },
  {
    id: "5",
    name: "Accu-Chek Active Glucose Meter",
    category: "Diabetes Care",
    price: 19800,
    description: "Highly accurate digital blood glucose monitoring system. Delivers results in 5 seconds with a tiny blood sample. Easy-to-read display.",
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 61
  },
  {
    id: "6",
    name: "Infant Multivitamin Drops",
    category: "Baby & Mother Care",
    price: 3400,
    description: "Essential multivitamin drops formulated for infants and toddlers. Contains vitamins A, C, D, and B-complex to support healthy growth and immune defense.",
    image: "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 39
  },
  {
    id: "7",
    name: "Vitamin C 1000mg Effervescent",
    category: "Vitamins & Supplements",
    price: 2800,
    description: "High-strength premium orange-flavored Vitamin C effervescent tablets. Dissolves quickly in water to support daily immunity and vitality.",
    image: "https://images.unsplash.com/photo-1626715243389-7cfdb6271c69?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 112
  },
  {
    id: "8",
    name: "First Aid Kit (Standard Home/Office)",
    category: "First Aid",
    price: 8500,
    description: "Fully compliant emergency first aid bag containing medical tape, bandages, shears, antiseptic wipes, burn gel, CPR mask, and safety pins.",
    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 27
  },
  {
    id: "9",
    name: "Fingertip Pulse Oximeter",
    category: "Medical Equipment",
    price: 9500,
    description: "Accurate SpO2 pulse rate oxygen monitor with crisp multi-directional OLED display. Perfect for clinics and home monitoring of arterial hemoglobin levels.",
    image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.6,
    reviewsCount: 33
  },
  {
    id: "10",
    name: "Digital Clinical Thermometer",
    category: "Medical Equipment",
    price: 2500,
    description: "Fast-reading digital body thermometer for oral, underarm, or rectal temperature measurement. Sound indicator alert for high temperature.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 74
  },
  {
    id: "11",
    name: "Dettol Antiseptic Liquid 500ml",
    category: "Personal Care",
    price: 3100,
    description: "Chloroxylenol formulation for antiseptic disinfection of cuts, wounds, skin, household surfaces, and laundry. Essential family germ defense.",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 156
  },
  {
    id: "12",
    name: "Surgical Face Masks (Box of 50)",
    category: "Hospital Supplies",
    price: 3500,
    description: "Premium 3-ply medical-grade disposable face masks with high filtration efficiency. Comfortable nose clips and stretchable elastic ear loops.",
    image: "https://images.unsplash.com/photo-1586942593568-29361efcd571?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.5,
    reviewsCount: 48
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Alhaji Ibrahim Musa",
    role: "Community Leader, Kaduna",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    comment: "Alpharma Medical Hub Nig Ltd is the best pharmacy in Kaduna! Their prices are very fair, and their drugs are always genuine. The free medical consultation advice on their AI and WhatsApp is super helpful.",
    date: "June 12, 2026"
  },
  {
    id: "2",
    name: "Dr. Chioma Nwachukwu",
    role: "Clinical Director, Kaduna",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    comment: "As a doctor, I recommend Alpharma Medical Hub Nig Ltd to our local clinics and hospitals in Kaduna State. Their surgical equipment and hospital supplies are of impeccable quality, and their delivery to our premises is always fast and secure.",
    date: "May 29, 2026"
  },
  {
    id: "3",
    name: "Mrs. Funmi Adebayo",
    role: "Mother of Two, Kaduna",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    comment: "I always order my baby formula, vitamins, and mother-care supplements from Alpharma Medical Hub Nig Ltd. The WhatsApp ordering is extremely fast. They delivered my items directly to my doorstep within 2 hours!",
    date: "June 18, 2026"
  },
  {
    id: "4",
    name: "Mallam Yusuf Bello",
    role: "Teacher, Kaduna State",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 4,
    comment: "The AI Customer Agent on their website guided me perfectly on which blood glucose meter to purchase and explained how to use the strips step-by-step. It's like having a digital pharmacist in your pocket!",
    date: "June 24, 2026"
  }
];

export const SERVICES = [
  {
    title: "Prescription Dispensing",
    description: "Submit prescriptions from verified medical professionals, and our licensed pharmacists will dispense them carefully with clear dosing advice.",
    icon: "ClipboardCheck"
  },
  {
    title: "Clinical Equipment Supply",
    description: "Sourcing, verification, and supply of surgical tables, laboratory equipment, patient monitors, and hospital furniture for clinics.",
    icon: "Activity"
  },
  {
    title: "Over-the-Counter Consultation",
    description: "Need help choosing the right medicine for standard symptoms? Speak to our team of experts via WhatsApp or use our custom medical AI Assistant.",
    icon: "ShieldAlert"
  },
  {
    title: "Home & Clinic Delivery",
    description: "Swift dispatch riders deliver medications, health supplies, and diagnostic systems right to your residence or clinic in Kaduna and across Kaduna State.",
    icon: "Truck"
  },
  {
    title: "Diagnostic Checkups",
    description: "Visit our hub in Kaduna for free quick diagnostic checks, including Blood Pressure tracking, blood sugar readings, and BMI analysis.",
    icon: "HeartPulse"
  },
  {
    title: "Institutional Procurements",
    description: "Bespoke bulk contracts for corporate bodies, universities, NGOs, and public clinics with premium quality assurances.",
    icon: "Briefcase"
  }
];
