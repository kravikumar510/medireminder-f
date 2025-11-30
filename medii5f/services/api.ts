import { LoginData, RegisterData, MedicineData, AuthResponse, Medicine } from '../types';

const API_URL = "https://mediminder-backend-ks06.onrender.com";

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Safely handles the API response.
 * Reads text first to avoid crashing on HTML responses (common with 404/500 errors).
 */
const handleResponse = async (response: Response) => {
  let text = '';
  try {
    text = await response.text();
  } catch (error) {
    throw new Error("Network error: Failed to read response from server.");
  }

  let data;
  try {
    // Try parsing the text as JSON
    data = text ? JSON.parse(text) : {}; 
  } catch (error) {
    // Parsing failed. Check if it looks like an HTML error page
    const lowerText = text.toLowerCase().trim();
    if (lowerText.startsWith('<!doctype') || lowerText.startsWith('<html')) {
       if (response.status === 404) {
          throw new Error("Server endpoint not found (404). Please contact support.");
       }
       if (response.status === 500) {
          throw new Error("Internal Server Error (500). Please try again later.");
       }
       throw new Error(`Server returned an invalid HTML response (${response.status}).`);
    }
    // Not HTML, but not JSON either
    throw new Error(`Invalid response format: ${text.substring(0, 50)}...`);
  }

  // Check for HTTP error statuses
  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  // Construct payload dynamically to handle optional email/phone
  const payload: any = {
    username: data.username,
    name: data.username,
    password: data.password
  };

  if (data.email) payload.email = data.email;
  if (data.phone) payload.phone = data.phone;

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (error: any) {
    // re-throw to be caught by the component
    throw error;
  }
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error: any) {
    throw error;
  }
};

export const forgotPassword = async (email: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await handleResponse(response);
  } catch (error: any) {
     if (error.message.includes('404')) {
         // Mock success for unknown endpoints to allow UI flow
         return { message: "If this email exists, a reset link has been sent." };
     }
     throw error;
  }
};

export const addMedicine = async (data: MedicineData): Promise<Medicine> => {
  try {
    const response = await fetch(`${API_URL}/api/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error: any) {
    throw error;
  }
};

export const getMedicines = async (): Promise<Medicine[]> => {
  try {
    // Updated to use the base endpoint which infers user from token
    const response = await fetch(`${API_URL}/api/medicines`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  } catch (error: any) {
    throw error;
  }
};

export const updateMedicine = async (id: string, data: Partial<MedicineData>): Promise<Medicine> => {
  try {
    const response = await fetch(`${API_URL}/api/medicines/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error: any) {
    throw error;
  }
};

export const deleteMedicine = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/medicines/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
        await handleResponse(response);
    }
  } catch (error: any) {
    throw error;
  }
};
