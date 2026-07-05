import { NextResponse } from "next/server";
import { 
  readUserDb, 
  listUserProjects, 
  createProject, 
  switchProject, 
  getActiveProjectId,
  getActiveProjectName 
} from "@/lib/db";

export async function GET(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const activeProjectId = getActiveProjectId(username);
    const activeProjectName = getActiveProjectName(username);
    const projects = listUserProjects(username);
    
    return NextResponse.json({ 
      activeProjectId, 
      activeProjectName, 
      projects 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const { action, projectId, projectName } = await req.json();
    
    if (action === "switch") {
      if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
      }
      const success = switchProject(projectId, username);
      if (!success) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ 
        success: true, 
        activeProjectId: projectId,
        activeProjectName: getActiveProjectName(username)
      });
    } 
    
    if (action === "create") {
      if (!projectName || !projectName.trim()) {
        return NextResponse.json({ error: "Missing or empty projectName" }, { status: 400 });
      }
      const newProjectId = createProject(projectName.trim(), username);
      return NextResponse.json({ 
        success: true, 
        activeProjectId: newProjectId,
        activeProjectName: projectName.trim()
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to perform project operation" }, { status: 500 });
  }
}
