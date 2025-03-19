import { STUB } from "../constants.js";
import { OrderResponse } from "../types.js";
import { apiClient } from "../api.js";

/**
 * Fetch details of a specific order by order ID
 * @param programId The program ID associated with the order
 * @param orderId The order ID to fetch
 * @param referenceNo Optional reference number for the order
 * @returns Promise with order information
 */
export const getOrderInformation = async (
  programId: string,
  orderId: string,
  referenceNo?: string
): Promise<OrderResponse> => {
  if (!programId) {
    throw new Error("Program ID is required");
  }

  if (!orderId) {
    throw new Error("Order ID is required");
  }

  // Build endpoint with optional reference number
  let endpoint = `/${STUB}/${programId}/orders/${orderId}`;

  if (referenceNo) {
    endpoint += `?reference_no=${referenceNo}`;
  }

  // Make authenticated API request
  const response = await apiClient.get<OrderResponse>(endpoint);

  if (response.error) {
    // Handle common errors based on the API documentation
    if (response.status === 400) {
      if (response.error.includes("Program ID")) {
        throw new Error("Invalid Program ID");
      } else if (response.error.includes("Invalid Order ID")) {
        throw new Error("Invalid Order ID");
      } else if (response.error.includes("reference no")) {
        throw new Error("Invalid reference number");
      }
    }
    throw new Error(response.error);
  }

  return response.data;
};
