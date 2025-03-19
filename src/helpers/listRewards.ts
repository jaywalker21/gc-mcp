import { STUB } from "../constants.js";
import { RewardsListResponse, Reward, RewardsRequestParams } from "../types.js";
import { apiClient } from "../api.js";

/**
 * Builds query string from request parameters
 * @param params Request parameters
 * @returns Formatted query string
 */
const buildQueryString = (params: RewardsRequestParams): string => {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const queryParams = new URLSearchParams();

  // Add all parameters that are defined
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Fetch list of available rewards with advanced filtering options
 * @param params Optional request parameters for filtering and pagination
 * @returns Promise with rewards list response
 */
export const listRewards = async (
  programId: string,
  params?: RewardsRequestParams
): Promise<RewardsListResponse> => {
  // Construct endpoint with query parameters
  const queryString = buildQueryString(params || {});
  const endpoint = `/${STUB}/${programId}/rewards${queryString}`;

  // Make authenticated API request
  const response = await apiClient.get<RewardsListResponse>(endpoint);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data;
};

/**
 * Format reward details for display in a human-readable format
 * @param reward Reward object
 * @returns Formatted string with reward details
 */
export const formatRewardDetails = (reward: Reward): string => {
  // Handle discount value display
  let discountDisplay = "";
  if (reward.discount && reward.discount.type) {
    const discountValue =
      reward.discount.value || reward.discount.discount_value || 0;
    discountDisplay = `Discount: ${(discountValue / 100).toFixed(2)}% (${
      reward.discount.type
    })`;
  }

  // Format denominations based on reward type
  let denominationsDisplay = "";
  if (reward.type === "gift_card") {
    if (
      reward.denomination_type === "fixed" &&
      Array.isArray(reward.eligible_fixed_denomination)
    ) {
      const formattedValues = reward.eligible_fixed_denomination
        .map((amount) => `₹${(amount / 100).toFixed(2)}`)
        .join(", ");
      denominationsDisplay = `Fixed denominations: ${formattedValues}`;
    } else if (
      reward.denomination_type === "range" &&
      Array.isArray(reward.eligible_range_denomination) &&
      reward.eligible_range_denomination.length >= 2
    ) {
      denominationsDisplay = `Range: ₹${(
        reward.eligible_range_denomination[0] / 100
      ).toFixed(2)} - ₹${(reward.eligible_range_denomination[1] / 100).toFixed(
        2
      )}`;
    }
  } else if (reward.type === "membership" && reward.amount) {
    denominationsDisplay = `Amount: ₹${(reward.amount / 100).toFixed(2)} / ${
      reward.interval || "month"
    }`;
  }

  // Format categories if available
  const categories =
    (reward.categories || reward.category)?.join(", ") || "No categories";

  // Format redemption channels
  const redemptionChannels =
    reward.display_parameters.redemption_channels.join(", ");

  // Format featured flag
  const featuredTag = reward.featured ? "⭐ FEATURED" : "";

  // Build the detailed description based on reward type
  let typeSpecificInfo = "";

  if (reward.type === "gift_card") {
    typeSpecificInfo = `Type: Gift Card
${denominationsDisplay}`;
  } else if (reward.type === "membership") {
    typeSpecificInfo = `Type: Membership
Interval: ${reward.interval}
${denominationsDisplay}`;
  } else if (reward.type === "offer") {
    typeSpecificInfo = `Type: Offer
Has Code: ${reward.offer_has_code === "TRUE" ? "Yes" : "No"}`;
  }

  // Build the complete reward description
  return `${featuredTag}
ID: ${reward.id}
Name: ${reward.display_parameters.name}
Brand: ${reward.brand.name}
${typeSpecificInfo}
${discountDisplay}
Status: ${reward.status}
Categories: ${categories}
Redemption: ${redemptionChannels}
Valid: ${new Date(
    parseInt(reward.start_date) * 1000
  ).toLocaleDateString()} - ${new Date(
    parseInt(reward.end_date) * 1000
  ).toLocaleDateString()}`;
};

/**
 * Format rewards into a clean table format
 * @param rewards Array of reward objects
 * @returns Formatted string with rewards in table format
 */
export const formatRewardsTable = (rewards: Reward[]): string => {
  if (rewards.length === 0) {
    return "No rewards found";
  }

  // Define column widths
  const columns = {
    name: 25,
    type: 10,
    category: 15,
    channels: 25,
    brand: 15,
    price: 12,
    id: 36, // Increased width for full ID
  };

  // Create table header with a more modern style
  let tableOutput = "```\n"; // Start code block for fixed-width formatting
  tableOutput += `| ${"REWARD NAME".padEnd(columns.name)} | ${"TYPE".padEnd(
    columns.type
  )} | ${"CATEGORY".padEnd(columns.category)} | ${"CHANNELS".padEnd(
    columns.channels
  )} | ${"BRAND".padEnd(columns.brand)} | ${"PRICE".padEnd(
    columns.price
  )} | ${"ID".padEnd(columns.id)} |`;

  // Add separator line
  tableOutput +=
    "\n|" +
    "-".repeat(columns.name + 2) +
    "|" +
    "-".repeat(columns.type + 2) +
    "|" +
    "-".repeat(columns.category + 2) +
    "|" +
    "-".repeat(columns.channels + 2) +
    "|" +
    "-".repeat(columns.brand + 2) +
    "|" +
    "-".repeat(columns.price + 2) +
    "|" +
    "-".repeat(columns.id + 2) +
    "|";

  // Add each reward as a row
  rewards.forEach((reward) => {
    // Format name (truncate if too long)
    const name = reward.display_parameters.name;
    const formattedName =
      name.length > columns.name - 2
        ? name.substring(0, columns.name - 5) + "..."
        : name;

    // Format brand name (truncate if too long)
    const brand = reward.brand.name;
    const formattedBrand =
      brand.length > columns.brand - 2
        ? brand.substring(0, columns.brand - 5) + "..."
        : brand;

    // Format category (use first category if available)
    const categoryList = reward.categories || reward.category || [];
    const primaryCategory = categoryList.length > 0 ? categoryList[0] : "N/A";
    const formattedCategory =
      primaryCategory.length > columns.category - 2
        ? primaryCategory.substring(0, columns.category - 5) + "..."
        : primaryCategory;

    // Format channels (join all redemption channels)
    const redemptionChannels =
      reward.display_parameters.redemption_channels || [];
    const joinedChannels = redemptionChannels.join(", ");
    const formattedChannels =
      joinedChannels.length > columns.channels - 2
        ? joinedChannels.substring(0, columns.channels - 5) + "..."
        : joinedChannels;

    // Format price based on reward type
    let price = "N/A";
    if (reward.type === "gift_card") {
      if (
        reward.denomination_type === "fixed" &&
        reward.eligible_fixed_denomination?.length
      ) {
        // Show the lowest and highest denomination if there are multiple
        if (reward.eligible_fixed_denomination.length > 1) {
          const min = Math.min(...reward.eligible_fixed_denomination);
          const max = Math.max(...reward.eligible_fixed_denomination);
          price = `₹${(min / 100).toFixed(0)}-${(max / 100).toFixed(0)}`;
        } else {
          price = `₹${(reward.eligible_fixed_denomination[0] / 100).toFixed(
            0
          )}`;
        }
      } else if (
        reward.denomination_type === "range" &&
        reward.eligible_range_denomination?.length
      ) {
        price = `₹${(reward.eligible_range_denomination[0] / 100).toFixed(
          0
        )}-${(reward.eligible_range_denomination[1] / 100).toFixed(0)}`;
      }
    } else if (reward.type === "membership" && reward.amount) {
      price = `₹${(reward.amount / 100).toFixed(0)}/${
        reward.interval?.slice(0, 1).toLowerCase() || "m"
      }`;
    } else if (reward.type === "offer" && reward.discount) {
      if (reward.discount.type === "percentage" && reward.discount.value) {
        price = `${reward.discount.value}% off`;
      } else if (reward.discount.type === "fixed" && reward.discount.value) {
        price = `₹${(reward.discount.value / 100).toFixed(0)} off`;
      }
    }

    // Add the row to the table with proper formatting
    tableOutput += `\n| ${formattedName.padEnd(
      columns.name
    )} | ${reward.type.padEnd(columns.type)} | ${formattedCategory.padEnd(
      columns.category
    )} | ${formattedChannels.padEnd(
      columns.channels
    )} | ${formattedBrand.padEnd(columns.brand)} | ${price.padEnd(
      columns.price
    )} | ${reward.id.padEnd(columns.id)} |`;
  });

  // End the code block
  tableOutput += "\n```";

  return tableOutput;
};
