# TypeScript MCP Server

A Model Context Protocol (MCP) server implementation using TypeScript and Fastify.

## What is MCP?

The Model Context Protocol (MCP) enables AI models to interact with external systems in a standardized way. It provides a framework for defining resources, tools, and prompts that LLMs can use to perform tasks.

For more information, visit the [Model Context Protocol repository](https://github.com/modelcontextprotocol/typescript-sdk).

## Features

- Implements the MCP protocol for LLM interactions
- Provides example resources, tools, and prompts
- Uses Fastify for high-performance HTTP handling
- Supports Server-Sent Events (SSE) for real-time communication
- Includes a client example for testing

## Requirements

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

4. Update the `.env` file with your merchant credentials and API configuration:

```
# Required for Basic Authentication
MERCHANT_ID=your_merchant_id
MERCHANT_SECRET=your_merchant_secret
MERCHANT_KEY=your_merchant_key

# API configuration
BASE_URL=https://your-api-url.com
```

## Running the Server

Start the development server with:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

The server will run on port 3000 by default. You can change this by setting the `PORT` environment variable in the `.env` file.

## Authentication

This server uses Basic Authentication for API requests. To configure authentication:

1. Set your `MERCHANT_ID`, `MERCHANT_SECRET`, and `MERCHANT_KEY` in the `.env` file
2. The system automatically creates Basic Auth headers for all API requests
3. You can also create custom authentication headers using the `createBasicAuthHeader()` function

For custom authentication needs, you can modify the `src/api.ts` file.

## API Endpoints

- `GET /sse`: Server-Sent Events endpoint for MCP communication
- `POST /messages`: Endpoint for clients to send messages to the MCP server

## Available Resources

- `greeting://welcome`: A static welcome message
- `users://{userId}`: A dynamic resource that returns user data

## Available Tools

- `echo`: Echoes back a message
- `calculate`: Performs basic arithmetic operations (add, subtract, multiply, divide)
- `get-program-balance`: Retrieves the current balance of a program
- `list-rewards`: Lists available gift card rewards with pagination support
- `get-reward-details`: Retrieves detailed information about a specific reward

## Available Interfaces

The project includes typed interfaces for API responses:

- `BalanceResponse`: For program balance information
- `Reward`: For gift card reward details
- `RewardsListResponse`: For the list of rewards with pagination

These interfaces help ensure type safety when working with API data.

## Available Prompts

- `ask-question`: A prompt template for asking questions

## Testing with the Example Client

The repository includes an example client that demonstrates how to connect to the MCP server and use its resources, tools, and prompts.

To run the example client (with the server already running):

```bash
npm run client
```

This will:

1. Connect to the MCP server
2. List available resources, tools, and prompts
3. Read the greeting resource
4. Call the echo tool
5. Call the calculate tool
6. Get the ask-question prompt

## Usage with LLMs

This MCP server can be used with LLM clients that support the MCP protocol. Refer to the MCP documentation for information on how to connect LLM clients to this server.

## License

MIT
