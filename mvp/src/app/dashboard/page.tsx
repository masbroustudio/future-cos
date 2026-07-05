'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  priority?: 'High' | 'Medium' | 'Low';
  category?: string;
  dueDate?: string;
};

type Project = {
  id: string;
  name: string;
  taskCount: number;
  completedCount: number;
  tasks: Task[];
};

export default function Dashboard() {
  const [username, setUsername] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('cos_username');
    if (!savedUser) {
      // Redirect to login (chat page) if no username saved
      window.location.href = '/chat';
      return;
    }
    setUsername(savedUser);
    fetchDashboardData(savedUser);
  }, []);

  const fetchDashboardData = async (user: string) => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'x-username': user }
      });
      const data = await res.json();
      setProjects(data.projects || []);
      setActiveProjectId(data.activeProjectId || '');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    if (!username) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username
        },
        body: JSON.stringify({ action: 'switch', projectId })
      });
      if (res.ok) {
        window.location.href = '/chat';
      }
    } catch (err) {
      console.error('Failed to switch project:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cos_username');
    localStorage.removeItem('cos_pin');
    window.location.href = '/';
  };

  // Helper to check if task is overdue
  const isTaskOverdue = (task: Task) => {
    if (task.status === 'completed' || !task.dueDate) return false;
    const parts = task.dueDate.split('-');
    if (parts.length !== 3) return false;
    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime();
  };

  // Generate 14 days timeline dates starting from today
  const timelineDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  // Helper to get index of dueDate in our 14-day window
  const getTaskTimelineData = (task: Task) => {
    if (!task.dueDate) return null;
    const parts = task.dueDate.split('-');
    if (parts.length !== 3) return null;
    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    dueDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isOverdue = diffDays < 0 && task.status !== 'completed';
    
    return {
      diffDays,
      isOverdue,
      color: task.status === 'completed'
        ? '#15A34A' // Completed = Success Green
        : isOverdue
        ? '#BE123C' // Overdue = Danger Red
        : task.priority === 'High'
        ? '#F97316' // High priority pending = Warning Orange
        : task.priority === 'Medium'
        ? '#1313BA' // Medium priority = Brand Indigo
        : '#8989DD' // Low priority = Brand Medium
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <p style={{ color: '#6363C6', fontSize: '14px', fontWeight: 600 }}>Memuat dashboard...</p>
      </div>
    );
  }

  // Calculate Global Metrics
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + p.taskCount, 0);
  const totalCompleted = projects.reduce((acc, p) => acc + p.completedCount, 0);
  const globalProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      
      {/* --- HEADER NAVBAR --- */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(20px)', 
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #E8E8F8'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#1313BA', letterSpacing: '-0.03em' }}>
              Future Chief of Staff (CoS)
            </span>
            <span style={{ fontSize: '11px', color: '#9090CE', background: '#E8E8F8', padding: '2px 8px', fontWeight: 700 }}>
              DASHBOARD
            </span>
          </Link>

          {/* Navigation & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '13px', color: '#6363C6', fontWeight: 600 }}>
              👤 <span style={{ textTransform: 'capitalize' }}>{username}</span>
            </span>
            
            <Link href="/chat" style={{
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              color: '#1313BA',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Ke Ruang Chat ➡️
            </Link>

            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#C81E1E',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* --- DASHBOARD SECTION CONTAINER --- */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
        
        {/* Title Block */}
        <div style={{ maxWidth: '768px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            📊 Ringkasan Workspace Anda
          </h1>
          <p style={{ fontSize: '14px', color: '#6363C6', lineHeight: 1.5 }}>
            Pantau status penyelesaian tugas dan performa semua proyek aktif Anda secara menyeluruh dalam satu layar terpusat.
          </p>
        </div>

        {/* --- GLOBAL METRICS CARDS --- */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '16px', // 16px widget grid gap per specification
          marginBottom: '32px'
        }}>
          {/* Card 1 */}
          <div style={{ border: '1px solid #E8E8F8', padding: '24px', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9090CE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Proyek</span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA', marginTop: '8px' }}>{totalProjects}</div>
          </div>
          
          {/* Card 2 */}
          <div style={{ border: '1px solid #E8E8F8', padding: '24px', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9090CE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tugas</span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA', marginTop: '8px' }}>{totalTasks}</div>
          </div>

          {/* Card 3 */}
          <div style={{ border: '1px solid #E8E8F8', padding: '24px', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9090CE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tugas Selesai</span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA', marginTop: '8px' }}>{totalCompleted} / {totalTasks}</div>
          </div>

          {/* Card 4 (Progress) */}
          <div style={{ border: '1px solid #E8E8F8', padding: '24px', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9090CE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kemajuan Global</span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA', marginTop: '8px', marginBottom: '12px' }}>{globalProgress}%</div>
            
            {/* Global Progress Bar (Square corner radius-xxl 0px) */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E8E8F8', borderRadius: '0px', overflow: 'hidden' }}>
              <div style={{ width: `${globalProgress}%`, height: '100%', backgroundColor: '#1313BA', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        </div>

        {/* --- PROJECTS GRID --- */}
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1313BA', letterSpacing: '-0.02em', marginBottom: '24px' }}>
          📂 Daftar Papan Kerja Proyek
        </h2>

        {projects.length === 0 ? (
          <div style={{ border: '1px solid #E8E8F8', padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
            <p style={{ color: '#9090CE', fontSize: '14px' }}>Belum ada proyek yang dibuat.</p>
            <Link href="/chat" style={{
              textDecoration: 'none',
              marginTop: '16px',
              display: 'inline-flex',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#1313BA',
              borderRadius: '0px',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0E0E8C'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1313BA'}
            >
              Mulai Buat Proyek di Ruang Chat
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '16px' // Grid gap 16px for widgets
          }}>
            {projects.map(proj => {
              const projectProgress = proj.taskCount > 0 ? Math.round((proj.completedCount / proj.taskCount) * 100) : 0;
              
              // Count priority & overdue
              const highTasks = proj.tasks.filter(t => t.priority === 'High' && t.status !== 'completed').length;
              const medTasks = proj.tasks.filter(t => t.priority === 'Medium' && t.status !== 'completed').length;
              const lowTasks = proj.tasks.filter(t => t.priority === 'Low' && t.status !== 'completed').length;
              const overdueTasks = proj.tasks.filter(isTaskOverdue).length;

              const isActive = proj.id === activeProjectId;

              return (
                <div key={proj.id} style={{
                  border: isActive ? '2px solid #1313BA' : '1px solid #E8E8F8',
                  borderRadius: '0px', // Square corners
                  padding: '28px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  position: 'relative'
                }}>
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#1313BA',
                      backgroundColor: '#E8E8F8',
                      padding: '2px 8px',
                      textTransform: 'uppercase'
                    }}>
                      Aktif saat ini
                    </span>
                  )}

                  {/* Project Info */}
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1313BA', letterSpacing: '-0.02em', marginBottom: '8px', maxWidth: '80%' }}>
                      {proj.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#9090CE', marginBottom: '14px', fontWeight: 500 }}>
                      📋 {proj.completedCount} dari {proj.taskCount} tugas selesai
                    </p>

                    {/* Progress Bar (Square) */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#E8E8F8', borderRadius: '0px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ width: `${projectProgress}%`, height: '100%', backgroundColor: '#1313BA', transition: 'width 0.3s ease' }}></div>
                    </div>

                    {/* Urgency indicators / breakdown */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {highTasks > 0 && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#ffebeb', color: '#ff3b30', fontWeight: 700 }}>
                          High: {highTasks}
                        </span>
                      )}
                      {medTasks > 0 && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#fff9e6', color: '#ff9500', fontWeight: 700 }}>
                          Medium: {medTasks}
                        </span>
                      )}
                      {lowTasks > 0 && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f5f5f7', color: '#86868b', fontWeight: 700 }}>
                          Low: {lowTasks}
                        </span>
                      )}
                      {overdueTasks > 0 && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#FFE4E6', color: '#BE123C', fontWeight: 700 }}>
                          ⚠️ Telat: {overdueTasks}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button: Small size per buttons.md specifications */}
                  <button
                    onClick={() => handleSwitchProject(proj.id)}
                    style={{
                      width: '100%',
                      padding: '8px 12px', // Small size padding per buttons.md
                      fontSize: '13px', // Small size font
                      fontWeight: 600,
                      color: isActive ? '#1313BA' : '#FFFFFF',
                      backgroundColor: isActive ? 'transparent' : '#1313BA',
                      border: isActive ? '2px solid #1313BA' : 'none',
                      borderRadius: '0px', // Square corners
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease, color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) {
                        e.currentTarget.style.backgroundColor = '#E8E8F8';
                      } else {
                        e.currentTarget.style.backgroundColor = '#0E0E8C';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } else {
                        e.currentTarget.style.backgroundColor = '#1313BA';
                      }
                    }}
                  >
                    {isActive ? 'Masuk ke Ruang Chat' : 'Pilih & Buka Proyek'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* --- GANTT TIMELINE SCHEDULE SECTION --- */}
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1313BA', letterSpacing: '-0.02em', marginTop: '48px', marginBottom: '16px' }}>
          📅 Linimasa Jadwal Tugas (Gantt Chart 14 Hari)
        </h2>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '20px',
          alignItems: 'center',
          fontSize: '13px'
        }}>
          {/* Priority filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#9090CE', fontWeight: 600 }}>Filter Prioritas:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'all', label: 'Semua' },
                { value: 'High', label: '🔥 Tinggi' },
                { value: 'Medium', label: '⚡ Sedang' },
                { value: 'Low', label: 'Low' }
              ].map(opt => {
                const isSelected = priorityFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPriorityFilter(opt.value as any)}
                    style={{
                      border: '1px solid #E8E8F8',
                      borderRadius: '0px',
                      padding: '4px 10px',
                      backgroundColor: isSelected ? '#1313BA' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#6363C6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#9090CE', fontWeight: 600 }}>Filter Status:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'all', label: 'Semua' },
                { value: 'pending', label: '⏳ Belum' },
                { value: 'completed', label: '✓ Selesai' }
              ].map(opt => {
                const isSelected = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value as any)}
                    style={{
                      border: '1px solid #E8E8F8',
                      borderRadius: '0px',
                      padding: '4px 10px',
                      backgroundColor: isSelected ? '#1313BA' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#6363C6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          border: '1px solid #E8E8F8',
          borderRadius: '0px', // Square corners per specs
          padding: '28px',
          backgroundColor: '#FFFFFF',
          overflowX: 'auto',
          boxSizing: 'border-box'
        }}>
          {/* Timeline Grid Header */}
          <div style={{ display: 'flex', minWidth: '800px', marginBottom: '16px', borderBottom: '1px solid #E8E8F8', paddingBottom: '12px' }}>
            <div style={{ width: '250px', flexShrink: 0, fontWeight: 700, fontSize: '13px', color: '#1313BA' }}>
              Nama Tugas & Proyek
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              {timelineDates.map((date, idx) => {
                const isToday = idx === 0;
                const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
                const dayNum = date.getDate();
                
                return (
                  <div key={idx} style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    fontSize: '11px', 
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? '#1313BA' : '#9090CE',
                    background: isToday ? '#E8E8F8' : 'transparent',
                    padding: '4px 0',
                    borderRight: idx !== 13 ? '1px solid #F4F4FC' : 'none'
                  }}>
                    <div>{dayName}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{dayNum}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Rows Grouped by Project */}
          {projects.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9090CE', textAlign: 'center', padding: '24px 0' }}>
              Belum ada data tugas untuk ditampilkan di linimasa.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '800px' }}>
              {projects.map(proj => {
                // Filter tasks that have due dates and match selected filters
                const tasksWithDue = proj.tasks ? proj.tasks.filter(t => {
                  const hasDue = !!t.dueDate;
                  const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
                  const matchStatus = statusFilter === 'all' || t.status === statusFilter;
                  return hasDue && matchPriority && matchStatus;
                }) : [];
                
                if (tasksWithDue.length === 0) return null;

                return (
                  <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Project Header Label */}
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      color: '#1313BA', 
                      backgroundColor: '#F4F4FC', 
                      padding: '4px 12px', 
                      borderLeft: '4px solid #1313BA'
                    }}>
                      📁 {proj.name}
                    </div>

                    {/* Tasks Rows */}
                    {tasksWithDue.map(task => {
                      const timelineData = getTaskTimelineData(task);
                      if (!timelineData) return null;
                      
                      const { diffDays, isOverdue, color } = timelineData;
                      
                      // Calculate bar width percentage
                      let barWidthPercent = 0;
                      let isBeyond = false;
                      
                      if (isOverdue) {
                        barWidthPercent = 100 / 14; // Span 1 day at Today column
                      } else if (diffDays >= 0 && diffDays < 14) {
                        barWidthPercent = ((diffDays + 1) / 14) * 100;
                      } else if (diffDays >= 14) {
                        barWidthPercent = 100;
                        isBeyond = true;
                      }

                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
                          {/* Left label: Task title & Priority */}
                          <div style={{ 
                            width: '250px', 
                            flexShrink: 0, 
                            paddingRight: '16px',
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: 600, 
                              color: task.status === 'completed' ? '#9090CE' : '#6363C6',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {task.title}
                            </span>
                            <span style={{ fontSize: '10px', color: '#9090CE', marginTop: '2px' }}>
                              Due: {task.dueDate} {isOverdue && <strong style={{ color: '#BE123C' }}>(Telat)</strong>}
                            </span>
                          </div>

                          {/* Right bar: Timeline Track (divided into 14 segments visually) */}
                          <div style={{ 
                            flex: 1, 
                            height: '24px', 
                            position: 'relative', 
                            display: 'flex', 
                            alignItems: 'center',
                            borderBottom: '1px solid #F4F4FC'
                          }}>
                            {/* Grid vertical markers */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                              {Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} style={{ flex: 1, height: '100%', borderRight: i !== 13 ? '1px solid #F4F4FC' : 'none' }}></div>
                              ))}
                            </div>

                            {/* Gantt Bar */}
                            <div style={{
                              position: 'absolute',
                              left: 0,
                              width: `${barWidthPercent}%`,
                              height: '12px',
                              backgroundColor: color,
                              borderRadius: '0px', // Square corners per specs
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              paddingRight: '6px',
                              boxSizing: 'border-box',
                              transition: 'width 0.3s ease'
                            }}>
                              {/* If completed, render a small checkmark inside the bar */}
                              {task.status === 'completed' && (
                                <span style={{ color: '#FFFFFF', fontSize: '9px', fontWeight: 800 }}>✓</span>
                              )}
                              {isBeyond && (
                                <span style={{ color: '#FFFFFF', fontSize: '9px', fontWeight: 800 }}>&gt;</span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
