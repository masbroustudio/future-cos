import fs from "fs";
import path from "path";

export type Task = { 
  id: string; 
  title: string; 
  status: "pending" | "completed";
  priority?: "High" | "Medium" | "Low";
  category?: string;
};

export type Project = {
  id: string;
  name: string;
  tasks: Task[];
  notes?: string;
};

export type UserDb = {
  activeProjectId: string;
  projects: Project[];
};

// Dapatkan path database berdasarkan username secara aman
function getDbPath(username: string = "default"): string {
  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  return process.env.NODE_ENV === "production"
    ? path.join("/tmp", `db_${safeUsername}.json`)
    : path.join(process.cwd(), `db_${safeUsername}.json`);
}

// BACA DATABASE UTAMA USER
export function readUserDb(username: string = "default"): UserDb {
  try {
    const dbPath = getDbPath(username);
    if (!fs.existsSync(dbPath)) {
      const initialDb: UserDb = {
        activeProjectId: "default",
        projects: [
          { id: "default", name: "Proyek Utama", tasks: [] }
        ]
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    const parsed = JSON.parse(data);
    
    // Migrasi: jika database user lama masih berupa array Task[], ubah ke struktur baru
    if (Array.isArray(parsed)) {
      const migratedDb: UserDb = {
        activeProjectId: "default",
        projects: [
          { id: "default", name: "Proyek Utama", tasks: parsed }
        ]
      };
      fs.writeFileSync(dbPath, JSON.stringify(migratedDb, null, 2));
      return migratedDb;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Failed to read user database for "${username}":`, error);
    return {
      activeProjectId: "default",
      projects: [{ id: "default", name: "Proyek Utama", tasks: [] }]
    };
  }
}

// TULIS DATABASE UTAMA USER
export function writeUserDb(db: UserDb, username: string = "default"): void {
  try {
    const dbPath = getDbPath(username);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error(`Failed to write user database for "${username}":`, error);
  }
}

// FUNGSI KOMPATIBILITAS: Baca tugas dari project yang sedang aktif
export function readTasks(username: string = "default"): Task[] {
  const db = readUserDb(username);
  const activeProj = db.projects.find(p => p.id === db.activeProjectId);
  return activeProj ? activeProj.tasks : [];
}

// FUNGSI KOMPATIBILITAS: Tulis tugas ke project yang sedang aktif
export function writeTasks(tasks: Task[], username: string = "default"): void {
  const db = readUserDb(username);
  const activeProjIndex = db.projects.findIndex(p => p.id === db.activeProjectId);
  if (activeProjIndex !== -1) {
    db.projects[activeProjIndex].tasks = tasks;
    writeUserDb(db, username);
  }
}

// FUNGSI KOMPATIBILITAS: Baca catatan dari project yang sedang aktif
export function readNotes(username: string = "default"): string {
  const db = readUserDb(username);
  const activeProj = db.projects.find(p => p.id === db.activeProjectId);
  return activeProj ? (activeProj.notes || "") : "";
}

// FUNGSI KOMPATIBILITAS: Tulis catatan ke project yang sedang aktif
export function writeNotes(notes: string, username: string = "default"): void {
  const db = readUserDb(username);
  const activeProjIndex = db.projects.findIndex(p => p.id === db.activeProjectId);
  if (activeProjIndex !== -1) {
    db.projects[activeProjIndex].notes = notes;
    writeUserDb(db, username);
  }
}

// Dapatkan ID project aktif
export function getActiveProjectId(username: string = "default"): string {
  return readUserDb(username).activeProjectId;
}

// Dapatkan nama project aktif
export function getActiveProjectName(username: string = "default"): string {
  const db = readUserDb(username);
  const activeProj = db.projects.find(p => p.id === db.activeProjectId);
  return activeProj ? activeProj.name : "Proyek Utama";
}

// List semua proyek milik user
export function listUserProjects(username: string = "default") {
  const db = readUserDb(username);
  return db.projects.map(p => ({
    id: p.id,
    name: p.name,
    taskCount: p.tasks.length,
    completedCount: p.tasks.filter(t => t.status === 'completed').length,
    tasks: p.tasks
  }));
}

// Buat proyek baru
export function createProject(projectName: string, username: string = "default"): string {
  const db = readUserDb(username);
  // Generate ID aman dari nama proyek
  const cleanName = projectName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const projectId = `${cleanName}_${Date.now().toString().slice(-4)}`;
  
  db.projects.push({
    id: projectId,
    name: projectName,
    tasks: []
  });
  
  db.activeProjectId = projectId;
  writeUserDb(db, username);
  return projectId;
}

// Ganti proyek aktif
export function switchProject(projectId: string, username: string = "default"): boolean {
  const db = readUserDb(username);
  if (db.projects.some(p => p.id === projectId)) {
    db.activeProjectId = projectId;
    writeUserDb(db, username);
    return true;
  }
  return false;
}
