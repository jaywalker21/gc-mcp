import { z } from "zod";
import { server } from "./init.js";
import { getMerchantProgrammeBalance } from "../helpers/getBalance.js";
import {
  listRewards,
  formatRewardDetails,
  formatRewardsTable,
} from "../helpers/listRewards.js";
import { createOrder } from "../helpers/createOrder.js";
import { OrderItem, Voucher } from "../types.js";
import { getOrderInformation } from "../helpers/getOrderInformation.js";

// Get Balance tool
server.tool(
  "get-program-balance",
  "Retrieves the current balance of the merchant wallet associated with Razorpay",
  {
    programId: z
      .string()
      .describe("The programme ID for which balance has to be checked"),
  },
  async ({ programId }) => {
    try {
      // Use the helper function with Basic Auth
      const balanceData = await getMerchantProgrammeBalance(programId);

      // Convert paise to rupees for display (assuming amount is in paise)
      const amountInRupees = (balanceData.item.amount / 100).toFixed(2);

      return {
        content: [
          {
            type: "text",
            text: `Program ${programId} has a balance of ₹${amountInRupees} ${balanceData.item.currency}`,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error checking balance: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// List Rewards tool
server.tool(
  "list-rewards",
  "Retrieves a list of available rewards with filtering options for the given program",
  {
    programId: z.string().describe("The program ID for which to fetch rewards"),
    page_id: z.string().optional().describe("Optional page ID for pagination"),
    count: z
      .string()
      .optional()
      .describe("Number of rewards to display per page"),
    brand_name: z.string().optional().describe("Filter by brand name"),
    category: z.string().optional().describe("Filter by reward category"),
    type: z
      .enum(["gift_card", "membership", "offer"])
      .optional()
      .describe("Filter by reward type"),
    featured: z
      .boolean()
      .optional()
      .describe("Filter for featured rewards only"),
    min_price: z
      .string()
      .optional()
      .describe("Filter by minimum price (in rupees)"),
    max_price: z
      .string()
      .optional()
      .describe("Filter by maximum price (in rupees)"),
    denomination: z
      .string()
      .optional()
      .describe("Filter by specific denomination. Denomination is in paisa"),
    sort_by: z
      .enum(["gmv", "units_sold"])
      .optional()
      .describe("Sort results by"),
  },
  async ({ programId, ...params }) => {
    try {
      // Use the helper function to get rewards list
      const rewardsData = await listRewards(programId, params);

      // Helper function to get reward denomination
      const getRewardDenomination = (reward: any): number | null => {
        if (reward.type === "gift_card") {
          if (
            reward.denomination_type === "fixed" &&
            reward.eligible_fixed_denomination?.length
          ) {
            return reward.eligible_fixed_denomination[0];
          } else if (
            reward.denomination_type === "range" &&
            reward.eligible_range_denomination?.length
          ) {
            return reward.eligible_range_denomination[0];
          }
        } else if (reward.type === "membership" && reward.amount) {
          return reward.amount;
        } else if (
          reward.type === "offer" &&
          reward.discount &&
          reward.discount.value
        ) {
          return reward.discount.value;
        }
        return null;
      };

      // Create the table structure as an object (for native MCP clients)
      const tableData = {
        type: "table",
        title: `Rewards for Program ${programId}`,
        columnLabels: [
          "Reward Name",
          "Type",
          "Category",
          "Channels",
          "Brand",
          "Denomination",
          "ID",
        ],
        rows: rewardsData.items.map((reward) => {
          const denomination = getRewardDenomination(reward);
          const displayDenomination = denomination
            ? `₹${(denomination / 100).toFixed(2)}`
            : "Variable";

          const channels =
            reward.display_parameters.redemption_channels.join(", ");

          return [
            reward.display_parameters.name.substring(0, 50) +
              (reward.display_parameters.name.length > 50 ? "..." : ""),
            reward.type,
            reward.category?.[0] || reward.categories?.[0] || "N/A",
            channels,
            reward.brand.name,
            displayDenomination,
            reward.id, // Full ID, not truncated
          ];
        }),
      };

      // Generate a markdown table for backwards compatibility
      const markdownTable = formatRewardsTable(rewardsData.items);

      // Create detailed text content
      const detailedText = rewardsData.items
        .map(
          (reward, index) =>
            `## Reward ${index + 1}\n${formatRewardDetails(reward)}`
        )
        .join("\n\n");

      // Pagination information
      const paginationInfo = rewardsData.next_page_id
        ? `More rewards available. Use page_id: "${rewardsData.next_page_id}" to see more.`
        : "";

      // Return a single content object with both detailed information and table data
      const summary = `Found ${rewardsData.count} rewards for program ${programId}`;

      return {
        content: [
          {
            type: "text",
            text: `${summary}\n\n# Rewards Table\n\n${markdownTable}\n\n# Detailed Information\n\n${detailedText}${
              paginationInfo ? "\n\n" + paginationInfo : ""
            }\n\n<!-- Table Data: ${JSON.stringify(tableData)} -->`,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error fetching rewards: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Place Order tool
server.tool(
  "place-reward-order",
  "Places an order for one or more rewards such as gift cards, memberships, or offers",
  {
    programId: z
      .string()
      .describe("The program ID for which to place the order"),
    reference_no: z.string().describe("Unique reference number for the order"),
    rewards: z
      .array(
        z.object({
          id: z
            .string()
            .describe(
              "Reward ID to purchase, same as ID returned in list-rewards tool"
            ),
          denomination: z
            .number()
            .optional()
            .describe(
              "Denomination amount in paise (required for gift cards). Mandatory for Gift Cards"
            ),
          interval: z
            .string()
            .optional()
            .describe(
              "Plan interval (required for memberships like 'Monthly'). Optional for gift cards and offers"
            ),
          quantity: z
            .number()
            .min(1)
            .max(4)
            .describe("Quantity to purchase (1-4)"),
        })
      )
      .describe("Array of rewards to purchase"),
    customer_name: z.string().optional().describe("Optional customer name"),
    customer_email: z
      .string()
      .email()
      .optional()
      .describe("Optional customer email"),
    customer_contact: z
      .number()
      .optional()
      .describe("Optional customer contact number"),
  },
  async ({
    programId,
    reference_no,
    rewards,
    customer_name,
    customer_email,
    customer_contact,
  }) => {
    try {
      // Prepare customer object if any customer details are provided
      const customer =
        customer_name || customer_email || customer_contact
          ? {
              name: customer_name,
              email: customer_email,
              contact: customer_contact,
            }
          : undefined;

      // Create order request object
      const orderRequest = {
        reference_no,
        rewards,
        customer,
      };

      // Call the helper function to place the order
      const orderResponse = await createOrder(programId, orderRequest);

      // Format the response for display
      let responseText = `Order placed successfully!\n\n`;

      if (orderResponse.order_id) {
        responseText += `Order ID: ${orderResponse.order_id}\n`;
      }

      responseText += `Reference No: ${orderResponse.reference_no}\n`;
      responseText += `Status: ${orderResponse.status}\n`;
      responseText += `Amount: ₹${(
        orderResponse.order_success_amount / 100
      ).toFixed(2)}\n\n`;

      // Add order items details
      responseText += `Order Items (${orderResponse.order.count}):\n\n`;

      // Get order items
      const orderItems = orderResponse.order.order_items;

      if ((orderItems?.length ?? 0) === 0) {
        responseText += "No order items found in the response.\n";
      }

      orderItems?.forEach((item: OrderItem, index: number) => {
        responseText += `Item ${index + 1}:\n`;
        responseText += `- Reward ID: ${item.reward_id}\n`;
        responseText += `- Type: ${item.reward_type}\n`;
        responseText += `- Quantity: ${item.quantity}\n`;
        responseText += `- Status: ${item.status}\n`;

        if (item.denomination) {
          responseText += `- Denomination: ₹${(item.denomination / 100).toFixed(
            2
          )}\n`;
        }

        if (item.interval) {
          responseText += `- Interval: ${item.interval}\n`;
        }

        if (item.failed_reason) {
          responseText += `- Failure Reason: ${item.failed_reason}\n`;
        }

        // Add voucher details if available
        if (item.vouchers && item.vouchers.length > 0) {
          responseText += `- Vouchers:\n`;
          item.vouchers.forEach((voucher: Voucher, vIndex: number) => {
            responseText += `  Voucher ${vIndex + 1}:\n`;
            responseText += `  - Code: ${voucher.code}\n`;
            responseText += `  - PIN: ${voucher.pin}\n`;
            responseText += `  - Valid until: ${new Date(
              voucher.validity * 1000
            ).toLocaleDateString()}\n`;
          });
        }

        responseText += "\n";
      });

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error placing order: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get Order Status tool
server.tool(
  "get-order-status",
  "Fetches the status of a specific order using the program ID, order ID, and an optional reference number.",
  {
    programId: z.string().describe("The program ID associated with the order"),
    orderId: z.string().describe("The order ID to fetch the status for"),
    referenceNo: z
      .string()
      .optional()
      .describe("Optional reference number for the order"),
  },
  async ({ programId, orderId, referenceNo }) => {
    try {
      const data = await getOrderInformation(programId, orderId, referenceNo);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);
