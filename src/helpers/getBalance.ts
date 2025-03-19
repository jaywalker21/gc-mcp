import { STUB } from "../constants.js";
import { BalanceResponse } from "../types.js";
import { apiClient, createBasicAuthHeader } from "../api.js";

export const getMerchantProgrammeBalance = async (
  programId: string
): Promise<BalanceResponse> => {
  // The apiClient already has the base Authorization header set up
  // Here we only need to add custom headers specific to this request
  const response = await apiClient.get<BalanceResponse>(
    `/${STUB}/${programId}/balance`,
    {
      headers: {
        "X-Merchant-Id": process.env.MERCHANT_ID ?? "",
      },
    }
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data;
};
