import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "@/lib/mcpServer";

// Each request creates a fresh stateless transport. MCP clients that need
// session continuity can be added later by switching to sessionIdGenerator.
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  const server = buildMcpServer();
  await server.connect(transport);

  try {
    const res = await transport.handleRequest(req);
    // CORS for cross-origin AI clients (read-only data).
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id, MCP-Protocol-Version");
    res.headers.set("Cache-Control", "no-store");
    return res;
  } finally {
    await server.close().catch(() => {});
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, MCP-Protocol-Version",
    },
  });
}
