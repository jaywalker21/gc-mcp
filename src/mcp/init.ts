import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Remove the HTTP transport for now as we'll focus on stdio transport
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create MCP server instance
export const server = new McpServer({
  name: "giftcard",
  version: "0.0.1",
  description: "Gift Card Management Server using MCP",
});

// Initialize MCP server
export async function initMCP(useHttp = false) {
  // For now, we'll just use stdio transport as recommended by MCP docs
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // console.log("MCP server running with stdio transport");
}
