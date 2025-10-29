import { api } from './api';

// --- INTERFACES (The "Instruction Manuals") ---

// Defines the shape of a user object from the API
export interface ApiUser {
  UID: number;
  Fname: string;
  Lname: string;
  username: string;
  role_id: number;
  is_active: number;
  phone: string | null;
  Email: string | null;
  address_id: number | null;
  address_name: string | null;
}

// Defines the data needed to create a new user
export interface NewUserData {
  Fname: string;
  Lname: string;
  username: string;
  password?: string; // Optional for updates
  phone: string | null;
  Email: string | null;
  address: string | null;
  role_id: number;
}

export interface AddressSearchResult {
    id: number;
    name: string;
}

// --- API FUNCTIONS ---

/**
 * Fetches the list of all users for the admin panel.
 */
// This is a new interface to describe the full API response
export interface UserApiResponse {
    total: number;
    page: number;
    limit: number;
    data: ApiUser[];
}

/**
 * Fetches a paginated list of all users for the admin panel.
 */
export const fetchAllUsers = async (
    page: number, 
    limit: number, 
    searchTerm: string = ''
): Promise<UserApiResponse> => {
    const response = await api.get(`/admin/users`, {
        params: { 
            page, 
            limit, 
            search: searchTerm 
        }
    });
    return response.data; // Return the full response object now
};

/**
 * Registers a new user.
 */
export const registerUser = async ( userData: NewUserData): Promise<any> => {
    const response = await api.post(`/users/register`, userData);
    return response.data;
};

/**
 * Updates an existing user's details.
 */
export const updateUser = async (userId: number, userData: Partial<NewUserData>): Promise<any> => {
    // Add a mandatory edit_reason for the backend
    const payload = { ...userData, edit_reason: 'Updated via admin panel' };
    const response = await api.put(`/admin/users/${userId}`, payload);
    return response.data;
};

/**
 * Changes a user's password.
 */
export const resetUserPassword = async ( userId: number, newPassword: string): Promise<any> => {
    const response = await api.put(`/admin/users/${userId}/password`, { newPassword });
    return response.data;
};

/**
 * Deactivates or reactivates a user's account.
 */
export const setUserStatus = async ( userId: number, isActive: boolean): Promise<any> => {
    const response = await api.put(`/admin/users/${userId}/status`, { is_active: isActive ? 1 : 0 });
    return response.data;
};

export const searchAddresses = async (
    params: { village?: string; district?: string; province?: string }
): Promise<AddressSearchResult[]> => {
    const response = await api.get(`/addresses/search`, {
        params: params // Pass the search parameters
    });
    return response.data;
};