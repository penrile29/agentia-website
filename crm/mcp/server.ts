import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCrmMcpServer } from "./tools.ts";

const server = createCrmMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
