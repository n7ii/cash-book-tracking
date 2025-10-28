import { api } from './api';

// This is the "Instruction Manual" for our detail data
// =======================================================
export interface CollectionDetail {
  member_id: number;
  status: 'PAID' | 'NOT_PAID';
  notes: string | null;
  Fname: string;
  Lname: string;
}
// =======================================================


// Add this new interface
export interface CollectionSummary {
    IID: number;
    total: number;
    notes: string | null;
    created_at: string;
    photo_url: string | null;
    employee_fname: string;
    employee_lname: string;
    collector_fname: string;
    collector_lname: string;
    market_name: string | null;
  }


/**
 * Fetches the list of PAID customers for a specific collection.
 * @param token The user's authentication token.
 * @param collectionId The ID of the main collection record.
 * @returns A promise that resolves to an array of paid collection details.
 */
export const fetchPaidDetails = async (collectionId: string): Promise<CollectionDetail[]> => {
    const response = await api.get(`/collections/${collectionId}/paid`, {
    });
    return response.data;
};


// Add this new function
export const fetchCollectionSummary = async (collectionId: string): Promise<CollectionSummary> => {
    const response = await api.get(`/collections/${collectionId}`, {
    });
    return response.data;
};


/**
 * Fetches the list of UNPAID customers for a specific collection.
 * @param token The user's authentication token.
 * @param collectionId The ID of the main collection record.
 * @returns A promise that resolves to an array of unpaid collection details.
 */
export const fetchUnpaidDetails = async (collectionId: string): Promise<CollectionDetail[]> => {
    const response = await api.get(`/collections/${collectionId}/unpaid`, {
    });
    return response.data;
};