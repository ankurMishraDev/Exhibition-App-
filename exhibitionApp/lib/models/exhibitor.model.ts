import { Timestamp } from 'firebase/firestore';

export interface ExhibitorModel {
  id: string;
  userId: string;
  contactPrefix: string;        // "Mr.", "Mrs.", "Dr." etc.
  contactPerson: string;        // Actual person name
  chiefExecutiveName?: string;
  companyName: string;
  email: string;
  mobile: string;
  telephone: string;
  fax?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  website: string;
  companyProfile: string;
  ippfMember: boolean;
  membershipNumber: string;
  logoUrl: string;
  profileImage?: string;
  gst?: string;
  pan?: string;
  tan?: string;
  productDetails?: ProductDetailsModel;
  isProfileComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductDetailsModel {
  id?: string;
  exhibitorId: string;
  segments: string[];
  categories: string[];         // Array of category strings
  machineryDescription: string;
  rawMaterialDescription: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
