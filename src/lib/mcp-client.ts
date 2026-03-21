import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:3001'

export interface McpTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface McpClient {
  tools: McpTool[]
  callTool: (name: string, input: Record<string, unknown>) => Promise<string>
  close: () => Promise<void>
}

export async function createMcpClient(): Promise<McpClient> {
  const transport = new SSEClientTransport(new URL(`${MCP_SERVER_URL}/sse`))
  const client = new Client({ name: 'wattprint-web', version: '1.0.0' })

  await client.connect(transport)

  const { tools } = await client.listTools()

  // Convert MCP tool format to Anthropic tool format
  const mcpTools: McpTool[] = tools.map(t => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: (t.inputSchema as McpTool['input_schema']) ?? { type: 'object', properties: {} },
  }))

  async function callTool(name: string, input: Record<string, unknown>): Promise<string> {
    const result = await client.callTool({ name, arguments: input })
    const content = result.content as Array<{ type: string; text?: string }>
    return content.map(c => c.text ?? '').join('\n')
  }

  async function close() {
    await client.close()
  }

  return { tools: mcpTools, callTool, close }
}
