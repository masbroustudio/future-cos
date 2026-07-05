import { NextRequest } from "next/server";
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";

const handleCopilotKitRequest = async (req: NextRequest) => {
  const langGraphAgent = new LangGraphHttpAgent({ url: "http://localhost:8000/copilotkit" });

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
