export interface ExhibitorModel {
  id: string;
  userId: string;
  contactPrefix: string;        // "Mr.", "Mrs.", "Dr." etc.
  contactPerson: string;        // Actual person name
  companyName: string;
  email: string;
  mobile: string;
  telephone: string;
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
  productDetails?: ProductDetailsModel;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailsModel {
  id?: string;
  exhibitorId: string;
  segments: string[];
  categories: string[];         // Array of category strings
  machineryDescription: string;
  rawMaterialDescription: string;
  createdAt?: string;
  updatedAt?: string;
}
