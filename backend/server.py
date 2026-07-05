import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# CopilotKit Imports
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from agent import graph

app = FastAPI(title="Future Chief of Staff (CoS) Backend")

# Izinkan CORS dari Next.js Frontend
allowed_origins = ["http://localhost:3000", "http://localhost:3001"]
frontend_env = os.getenv("FRONTEND_URL")
if frontend_env:
    # Allow both raw URL and potential variations without trailing slash
    allowed_origins.append(frontend_env.rstrip("/"))
    allowed_origins.append(frontend_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mendaftarkan Agent LangGraph ke CopilotKit
agent = LangGraphAGUIAgent(
    name="default",
    description="Asisten Chief of Staff (CoS) Eksekutif",
    graph=graph
)

# Endpoint khusus untuk CopilotKit Protocol via ag_ui_langgraph
add_langgraph_fastapi_endpoint(app, agent, "/copilotkit")

@app.get("/")
def read_root():
    return {"status": "Backend Future Chief of Staff (CoS) Aktif (A2UI Ready)"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
