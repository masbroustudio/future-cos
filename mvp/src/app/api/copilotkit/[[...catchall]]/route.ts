import { NextRequest } from "next/server";
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";

const handleCopilotKitRequest = async (req: NextRequest) => {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const langGraphAgent = new LangGraphHttpAgent({ url: `${backendBaseUrl}/copilotkit` });

  const runtime = new CopilotRuntime({
    agents: { default: langGraphAgent },
    a2ui: { injectA2UITool: true },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  
  return handleRequest(req);
};

export const POST = handleCopilotKitRequest;
export const GET = handleCopilotKitRequest;
