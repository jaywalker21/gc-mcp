import { STUB } from "../constants.js";
import { CreateOrderRequest, OrderResponse } from "../types.js";
import { apiClient } from "../api.js";

/**
 * Creates a new order for rewards in the marketplace
 * @param programId - The program ID for which to create the order
 * @param request - The order creation request containing rewards and customer details
 * @returns Promise<OrderResponse> - The order response containing order details and vouchers
 * @throws Error if the request fails or validation errors occur
 */
export async function createOrder(
  programId: string,
  request: CreateOrderRequest
): Promise<OrderResponse> {
  if (!programId) {
    throw new Error("Program ID is required");
  }

  if (!request.reference_no) {
    throw new Error("Reference number is required");
  }

  if (!request.rewards || request.rewards.length === 0) {
    throw new Error("At least one reward is required");
  }

  // Validate each reward
  request.rewards.forEach((reward, index) => {
    if (!reward.id) {
      throw new Error(`Reward ID is required for reward at index ${index}`);
    }
    if (!reward.quantity || reward.quantity < 1 || reward.quantity > 4) {
      throw new Error(
        `Invalid quantity for reward at index ${index}. Must be between 1 and 4.`
      );
    }
  });

  try {
    const response = await apiClient.post<OrderResponse>(
      `/${STUB}/${programId}/orders`,
      request
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
    throw new Error("Failed to create order: Unknown error occurred");
  }
}
