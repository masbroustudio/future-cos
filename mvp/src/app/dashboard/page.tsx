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
        ? '#16A34A' 
        : isOverdue
        ? '#DC2626' 
        : task.priority === 'High'
        ? '#D97706' 
        : task.priority === 'Medium'
        ? '#3B82F6' 
        : '#9CA3AF' 
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <p style={{ color: '#4B5563', fontSize: '13px', fontWeight: 500 }}>Loading workspace dashboard...</p>
      </div>
    );
  }

  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + p.taskCount, 0);
  const totalCompleted = projects.reduce((acc, p) => acc + p.completedCount, 0);
  const globalProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', fontFamily: '"Inter", -apple-system, sans-serif', color: '#111827' }}>
      
      {/* --- HEADER NAVBAR --- */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '16px', color: '#111827', letterSpacing: '-0.02em' }}>
              Future Chief of Staff
            </span>
            <span style={{ fontSize: '9px', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.08)', padding: '2px 8px', fontWeight: 600, borderRadius: '4px' }}>
              DASHBOARD
            </span>
          </Link>

          {/* Navigation & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>
              Active User: <span style={{ textTransform: 'capitalize', color: '#111827', fontWeight: 600 }}>{username}</span>
            </span>
            
            <Link href="/chat" style={{
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 500,
              color: '#3B82F6',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Go to Workspace
            </Link>

            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* --- DASHBOARD CONTAINER (8pt Spacing grid) --- */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        
        {/* Title Block */}
        <div style={{ maxWidth: '720px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Workspace Summary
          </h1>
          <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5 }}>
            Monitor overall task progression, timelines, and execution metrics of all active project boards in a single unified dashboard.
          </p>
        </div>

        {/* --- GLOBAL METRICS CARDS (60-30-10 Layout) --- */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '32px'
        }}>
          {/* Card 1 */}
          <div style={{ border: '1px solid #E5E7EB', padding: '20px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Projects</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginTop: '8px' }}>{totalProjects}</div>
          </div>
          
          {/* Card 2 */}
          <div style={{ border: '1px solid #E5E7EB', padding: '20px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tasks</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginTop: '8px' }}>{totalTasks}</div>
          </div>

          {/* Card 3 */}
          <div style={{ border: '1px solid #E5E7EB', padding: '20px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Tasks</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginTop: '8px' }}>{totalCompleted} / {totalTasks}</div>
          </div>

          {/* Card 4 (Progress) */}
          <div style={{ border: '1px solid #E5E7EB', padding: '20px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Progress</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#3B82F6', marginTop: '8px', marginBottom: '8px' }}>{globalProgress}%</div>
            
            <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${globalProgress}%`, height: '100%', backgroundColor: '#3B82F6', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        </div>

        {/* --- PROJECTS GRID --- */}
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginBottom: '16px' }}>
          📂 Project Workspace Boards
        </h2>

        {projects.length === 0 ? (
          <div style={{ border: '1px solid #E5E7EB', padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
            <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No active projects found.</p>
            <Link href="/chat" style={{
              textDecoration: 'none',
              marginTop: '16px',
              display: 'inline-flex',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#FFFFFF',
              backgroundColor: '#3B82F6',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
            >
              Create Project in Chat Workspace
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {projects.map(proj => {
              const projectProgress = proj.taskCount > 0 ? Math.round((proj.completedCount / proj.taskCount) * 100) : 0;
              
              const highTasks = proj.tasks.filter(t => t.priority === 'High' && t.status !== 'completed').length;
              const medTasks = proj.tasks.filter(t => t.priority === 'Medium' && t.status !== 'completed').length;
              const lowTasks = proj.tasks.filter(t => t.priority === 'Low' && t.status !== 'completed').length;
              const overdueTasks = proj.tasks.filter(isTaskOverdue).length;

              const isActive = proj.id === activeProjectId;

              return (
                <div key={proj.id} style={{
                  border: isActive ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: '8px', 
                  padding: '24px',
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
                      fontSize: '9px',
                      fontWeight: 600,
                      color: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      Currently Active
                    </span>
                  )}

                  {/* Project Info */}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', letterSpacing: '-0.01em', marginBottom: '6px', maxWidth: '75%' }}>
                      {proj.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '12px' }}>
                      📋 {proj.completedCount} of {proj.taskCount} tasks completed
                    </p>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                      <div style={{ width: `${projectProgress}%`, height: '100%', backgroundColor: isActive ? '#3B82F6' : '#9CA3AF', transition: 'width 0.3s ease' }}></div>
                    </div>

                    {/* Urgency indicators */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {highTasks > 0 && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(220, 38, 26, 0.06)', color: '#DC2626', fontWeight: 600 }}>
                          High: {highTasks}
                        </span>
                      )}
                      {medTasks > 0 && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.06)', color: '#D97706', fontWeight: 600 }}>
                          Medium: {medTasks}
                        </span>
                      )}
                      {lowTasks > 0 && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#F3F4F6', color: '#4B5563', fontWeight: 500 }}>
                          Low: {lowTasks}
                        </span>
                      )}
                      {overdueTasks > 0 && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(220, 38, 26, 0.08)', color: '#DC2626', fontWeight: 600 }}>
                          ⚠️ Overdue: {overdueTasks}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSwitchProject(proj.id)}
                    style={{
                      width: '100%',
                      padding: '8px 12px', 
                      fontSize: '12px', 
                      fontWeight: 500,
                      color: isActive ? '#3B82F6' : '#FFFFFF',
                      backgroundColor: isActive ? 'transparent' : '#3B82F6',
                      border: isActive ? '1px solid #3B82F6' : 'none',
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.04)';
                      } else {
                        e.currentTarget.style.backgroundColor = '#2563EB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } else {
                        e.currentTarget.style.backgroundColor = '#3B82F6';
                      }
                    }}
                  >
                    {isActive ? 'Enter Chat Workspace' : 'Select & Open Project'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* --- GANTT TIMELINE SCHEDULE SECTION --- */}
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginTop: '40px', marginBottom: '16px' }}>
          📅 Task Schedule Timeline (14-Day Gantt Chart)
        </h2>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '16px',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          {/* Priority filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4B5563', fontWeight: 500 }}>Priority Filter:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'High', label: '🔥 High' },
                { value: 'Medium', label: '⚡ Medium' },
                { value: 'Low', label: 'Low' }
              ].map(opt => {
                const isSelected = priorityFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPriorityFilter(opt.value as any)}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      backgroundColor: isSelected ? '#3B82F6' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#4B5563',
                      fontWeight: 500,
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
            <span style={{ color: '#4B5563', fontWeight: 500 }}>Status Filter:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: '⏳ Pending' },
                { value: 'completed', label: '✓ Completed' }
              ].map(opt => {
                const isSelected = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value as any)}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      backgroundColor: isSelected ? '#3B82F6' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#4B5563',
                      fontWeight: 500,
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
          border: '1px solid #E5E7EB',
          borderRadius: '8px', 
          padding: '24px',
          backgroundColor: '#FFFFFF',
          overflowX: 'auto',
          boxSizing: 'border-box'
        }}>
          {/* Timeline Grid Header */}
          <div style={{ display: 'flex', minWidth: '800px', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
            <div style={{ width: '240px', flexShrink: 0, fontWeight: 600, fontSize: '12px', color: '#111827' }}>
              Task Name & Project
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              {timelineDates.map((date, idx) => {
                const isToday = idx === 0;
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                
                return (
                  <div key={idx} style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    fontSize: '10px', 
                    fontWeight: isToday ? 600 : 500,
                    color: isToday ? '#3B82F6' : '#9CA3AF',
                    backgroundColor: isToday ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                    padding: '4px 0',
                    borderRadius: isToday ? '4px' : '0px',
                    borderRight: idx !== 13 ? '1px solid #F3F4F6' : 'none'
                  }}>
                    <div>{dayName}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>{dayNum}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Rows Grouped by Project */}
          {projects.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
              No tasks available to show on the timeline.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '800px' }}>
              {projects.map(proj => {
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
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: '#3B82F6', 
                      backgroundColor: 'rgba(59, 130, 246, 0.04)', 
                      padding: '4px 12px', 
                      borderLeft: '3px solid #3B82F6',
                      borderRadius: '0 4px 4px 0'
                    }}>
                      📁 {proj.name}
                    </div>

                    {/* Tasks Rows */}
                    {tasksWithDue.map(task => {
                      const timelineData = getTaskTimelineData(task);
                      if (!timelineData) return null;
                      
                      const { diffDays, isOverdue, color } = timelineData;
                      
                      let barWidthPercent = 0;
                      let isBeyond = false;
                      
                      if (isOverdue) {
                        barWidthPercent = 100 / 14; 
                      } else if (diffDays >= 0 && diffDays < 14) {
                        barWidthPercent = ((diffDays + 1) / 14) * 100;
                      } else if (diffDays >= 14) {
                        barWidthPercent = 100;
                        isBeyond = true;
                      }

                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                          {/* Left label */}
                          <div style={{ 
                            width: '240px', 
                            flexShrink: 0, 
                            paddingRight: '16px',
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 500, 
                              color: task.status === 'completed' ? '#9CA3AF' : '#111827',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {task.title}
                            </span>
                            <span style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>
                              Due: {task.dueDate} {isOverdue && <strong style={{ color: '#DC2626' }}>(Overdue)</strong>}
                            </span>
                          </div>

                          {/* Right bar */}
                          <div style={{ 
                            flex: 1, 
                            height: '20px', 
                            position: 'relative', 
                            display: 'flex', 
                            alignItems: 'center',
                            borderBottom: '1px solid #F3F4F6'
                          }}>
                            {/* Grid vertical markers */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                              {Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} style={{ flex: 1, height: '100%', borderRight: i !== 13 ? '1px solid #F3F4F6' : 'none' }}></div>
                              ))}
                            </div>

                            {/* Gantt Bar */}
                            <div style={{
                              position: 'absolute',
                              left: 0,
                              width: `${barWidthPercent}%`,
                              height: '10px',
                              backgroundColor: color,
                              borderRadius: '4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              paddingRight: '6px',
                              boxSizing: 'border-box',
                              transition: 'width 0.3s ease'
                            }}>
                              {task.status === 'completed' && (
                                <span style={{ color: '#FFFFFF', fontSize: '8px', fontWeight: 700 }}>✓</span>
                              )}
                              {isBeyond && (
                                <span style={{ color: '#FFFFFF', fontSize: '8px', fontWeight: 700 }}>&gt;</span>
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
