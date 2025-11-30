export interface User {
  _id: string;
  id?: string; // Some backends return id instead of _id
  username: string;
  name?: string; // Some backends use name
  email: string;
  token?: string;
  avatar?: string; // Local storage or backend provided
}

export type MedicineType = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Inhaler' | 'Cream' | 'Other';

export interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  type?: MedicineType; // New field
  user: string; // User ID
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  phone?: string;
}

export interface MedicineData {
  name: string;
  dosage: string;
  frequency: string;
  type?: string;
  user: string;
}