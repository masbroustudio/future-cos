'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import BriefingCard from "./genui/BriefingCard";
import DecisionLogCard from "./genui/DecisionLogCard";
import ScenarioChart from "./genui/ScenarioChart";
import ReportCard from "./genui/ReportCard";
import MarketDigestCard from "./genui/MarketDigestCard";

type Subtask = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
};

type Task = { 
  id: string; 
  title: string; 
  status: 'pending' | 'completed';
  priority?: 'High' | 'Medium' | 'Low';
  category?: string;
  subtasks?: Subtask[];
  dueDate?: string;
};

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  genUI?: {
    componentName: string;
    props: any;
  };
};

type ProjectInfo = {
  id: string;
  name: string;
  taskCount: number;
  completedCount: number;
};

const getDueDateStatus = (dueDateStr?: string, isCompleted?: boolean) => {
  if (!dueDateStr) return { label: '📅 Set Tenggat', color: '#86868b', background: '#f5f5f7', isOverdue: false, isToday: false };
  
  // Parse date safely
  const parts = dueDateStr.split('-');
  if (parts.length !== 3) return { label: '📅 Set Tenggat', color: '#86868b', background: '#f5f5f7', isOverdue: false, isToday: false };
  
  const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  dueDate.setHours(0, 0, 0, 0);

  if (isCompleted) {
    const dateFormatted = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(dueDate);
    return { label: `📅 Selesai (${dateFormatted})`, color: '#86868b', background: '#f5f5f7', isOverdue: false, isToday: false };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { label: `⚠️ Overdue by ${Math.abs(diffDays)} days`, color: '#ff3b30', background: '#ffebeb', isOverdue: true, isToday: false };
  } else if (diffDays === 0) {
    return { label: '📅 Today', color: '#ff9500', background: '#fff9e6', isOverdue: false, isToday: true };
  } else {
    const dateFormatted = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(dueDate);
    return { label: `📅 ${dateFormatted}`, color: '#0071e3', background: '#e8f2fc', isOverdue: false, isToday: false };
  }
};

// --- SUB-KOMPONEN 1: KARTU TUGAS INTERAKTIF ---
function TaskListCard({ 
  items, 
  onToggle, 
  onDelete,
  onUpdateDueDate
}: { 
  items: Task[]; 
  onToggle: (id: string, status: 'pending' | 'completed', subtaskId?: string) => void; 
  onDelete: (id: string) => void;
  onUpdateDueDate?: (id: string, date: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Ambil semua kategori unik dari daftar tugas secara dinamis
  const categories = ['all', ...Array.from(new Set(items.map(t => t.category).filter(Boolean) as string[]))];

  const filteredItems = items.filter(item => {
    // 1. Filter Status (Aktif/Selesai)
    if (filter === 'pending' && item.status !== 'pending') return false;
    if (filter === 'completed' && item.status !== 'completed') return false;

    // 2. Filter Tag Kategori
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

    // 3. Filter Pencarian Teks
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(q);
      const catMatch = item.category?.toLowerCase().includes(q) || false;
      const prioMatch = item.priority?.toLowerCase().includes(q) || false;
      return titleMatch || catMatch || prioMatch;
    }

    return true;
  });

  return (
    <div className="genui-card animate-enter" style={{ animationDelay: '0.2s', marginTop: '16px' }}>
      {/* Header & Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ fontWeight: 700, fontSize: '16px', color: '#1d1d1f', letterSpacing: '-0.01em' }}>📋 Daftar Tugas</h4>
        <div style={{ display: 'flex', gap: '4px', background: '#f5f5f7', padding: '3px', borderRadius: '12px' }}>
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filter === f ? '#ffffff' : 'transparent',
                boxShadow: filter === f ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                color: filter === f ? '#1d1d1f' : '#86868b',
                transition: 'all 0.2s'
              }}
            >
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Aktif' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Kolom Pencarian Teks */}
      <div style={{ position: 'relative', marginBottom: '12px', width: '100%' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#86868b' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <input 
          type="text" 
          placeholder="Search tasks, categories, or priorities..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 32px 8px 36px',
            background: '#f5f5f7',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#1d1d1f',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#0071e3';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = '#f5f5f7';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#86868b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '2px'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Pills Filter Kategori */}
      {categories.length > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          paddingBottom: '8px', 
          marginBottom: '10px',
          width: '100%',
          scrollbarWidth: 'none',
        }} className="scrollbar-hidden">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: selectedCategory === cat ? '#0071e3' : '#f5f5f7',
                color: selectedCategory === cat ? '#ffffff' : '#86868b',
                transition: 'all 0.2s',
                boxShadow: selectedCategory === cat ? '0 2px 6px rgba(0, 113, 227, 0.2)' : 'none'
              }}
            >
              {cat === 'all' ? '🏷️ Semua Kategori' : cat}
            </button>
          ))}
        </div>
      )}

      {/* List Items */}
      {filteredItems.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13.5px', textAlign: 'center', padding: '20px 0' }}>
          {items.length === 0 ? "No tasks in this project." : "No tasks match the filters."}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredItems.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <input 
                type="checkbox" 
                checked={task.status === 'completed'} 
                onChange={() => onToggle(task.id, task.status)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)', cursor: 'pointer' }} 
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <span style={{ 
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none', 
                  color: task.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {task.title}
                </span>
                
                {/* Metadata Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {task.category && (
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '1px 8px', 
                      background: '#e8f2fc', 
                      color: '#0071e3', 
                      borderRadius: '10px', 
                      fontWeight: 700 
                    }}>
                      {task.category}
                    </span>
                  )}
                  {task.priority && (
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '1px 8px', 
                      background: task.priority === 'High' ? '#ffebeb' : task.priority === 'Medium' ? '#fff9e6' : '#f5f5f7', 
                      color: task.priority === 'High' ? '#ff3b30' : task.priority === 'Medium' ? '#ff9500' : '#86868b', 
                      borderRadius: '10px', 
                      fontWeight: 700 
                    }}>
                      {task.priority}
                    </span>
                  )}
                  {/* Tenggat Waktu (Due Date) Selector / Badge */}
                  {onUpdateDueDate ? (
                    <input 
                      type="date" 
                      value={task.dueDate || ''}
                      onChange={(e) => onUpdateDueDate(task.id, e.target.value)}
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        background: getDueDateStatus(task.dueDate, task.status === 'completed').background,
                        color: getDueDateStatus(task.dueDate, task.status === 'completed').color,
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'inherit',
                        minHeight: '18px'
                      }}
                    />
                  ) : (
                    task.dueDate && (
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '1px 8px', 
                        background: getDueDateStatus(task.dueDate, task.status === 'completed').background, 
                        color: getDueDateStatus(task.dueDate, task.status === 'completed').color, 
                        borderRadius: '10px', 
                        fontWeight: 700 
                      }}>
                        {getDueDateStatus(task.dueDate, task.status === 'completed').label}
                      </span>
                    )
                  )}
                </div>

                {/* Checklist Subtugas (Nested Checklist) */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px', 
                    marginTop: '8px', 
                    paddingLeft: '12px', 
                    borderLeft: '2px solid rgba(0,0,0,0.06)' 
                  }}>
                    {task.subtasks.map(st => (
                      <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={st.status === 'completed'} 
                          onChange={() => onToggle(task.id, task.status, st.id)}
                          style={{ width: '14px', height: '14px', accentColor: 'var(--accent-color)', cursor: 'pointer' }} 
                        />
                        <span style={{ 
                          textDecoration: st.status === 'completed' ? 'line-through' : 'none', 
                          color: st.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
                          fontSize: '12.5px',
                          fontWeight: 500
                        }}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Hapus Tugas */}
              <button 
                onClick={() => onDelete(task.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#86868b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff3b30';
                  e.currentTarget.style.background = '#ffebeb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#86868b';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1422C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86725 19.1422L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SUB-KOMPONEN 2: KARTU SUMMARY PROYEK ---
function ProjectSummaryCard({ 
  projectName, 
  summary, 
  status, 
  allTasks 
}: { 
  projectName: string; 
  summary: string; 
  status: string; 
  allTasks: Task[]; 
}) {
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Perhitungan SVG Donut Chart
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Breakdown Prioritas untuk tugas yang belum selesai
  const highCount = allTasks.filter(t => t.priority === 'High' && t.status === 'pending').length;
  const medCount = allTasks.filter(t => t.priority === 'Medium' && t.status === 'pending').length;
  const lowCount = allTasks.filter(t => t.priority === 'Low' && t.status === 'pending').length;

  // Lebar Bar Chart relatif (nilai tertinggi mengambil porsi penuh 260px)
  const maxCount = Math.max(highCount, medCount, lowCount, 1);
  const highWidth = (highCount / maxCount) * 260;
  const medWidth = (medCount / maxCount) * 260;
  const lowWidth = (lowCount / maxCount) * 260;

  return (
    <div className="genui-card animate-enter" style={{ animationDelay: '0.2s', marginTop: '16px', background: 'linear-gradient(145deg, #ffffff 0%, #f9f9fa 100%)', border: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Header & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f' }}>🚀 {projectName}</h3>
        <span style={{ 
          padding: '4px 10px', 
          background: status === 'On Track' ? '#e8fdf0' : status === 'At Risk' ? '#fff9e6' : '#ffebeb', 
          color: status === 'On Track' ? '#34c759' : status === 'At Risk' ? '#ff9500' : '#ff3b30', 
          borderRadius: '12px', 
          fontSize: '11.5px', 
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            backgroundColor: status === 'On Track' ? '#34c759' : status === 'At Risk' ? '#ff9500' : '#ff3b30', 
            borderRadius: '50%' 
          }}></span>
          {status}
        </span>
      </div>
      
      <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '18px' }}>{summary}</p>
      
      {/* Grafik Kemajuan Lingkaran SVG */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0', padding: '14px 18px', background: '#f5f5f7', borderRadius: '18px' }}>
        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            {/* Background ring */}
            <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
            {/* Progress ring */}
            <circle 
              cx="32" 
              cy="32" 
              r={radius} 
              fill="none" 
              stroke="#0071e3" 
              strokeWidth="5" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#1d1d1f' }}>
            {completionRate}%
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '14px', color: '#1d1d1f', marginBottom: '2px' }}>Project Progress</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{completedTasks} of {totalTasks} tasks completed</p>
        </div>
      </div>

      {/* Pembatas / Divider */}
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '16px 0 12px 0' }} />
      
      {/* Judul Grafik Prioritas */}
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1d1d1f', marginBottom: '12px', letterSpacing: '-0.01em' }}>
        📊 Urgensi Prioritas Tugas Aktif
      </h4>
      
      {/* Grafik Batang SVG Dinamis */}
      <div style={{ width: '100%' }}>
        <svg width="100%" height="96" viewBox="0 0 400 96" style={{ overflow: 'visible' }}>
          {/* Row 1: High Priority */}
          <g>
            <text x="0" y="20" fill="#ff3b30" style={{ fontSize: '12px', fontWeight: 700 }}>🔴 Tinggi</text>
            <rect x="80" y="10" width="260" height="10" rx="5" fill="#f5f5f7" />
            <rect 
              x="80" 
              y="10" 
              width={highWidth} 
              height="10" 
              rx="5" 
              fill="#ff3b30"
              style={{ transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <text x="355" y="20" fill="#ff3b30" style={{ fontSize: '12px', fontWeight: 700 }}>{highCount}</text>
          </g>

          {/* Row 2: Medium Priority */}
          <g>
            <text x="0" y="50" fill="#ff9500" style={{ fontSize: '12px', fontWeight: 700 }}>🟡 Sedang</text>
            <rect x="80" y="40" width="260" height="10" rx="5" fill="#f5f5f7" />
            <rect 
              x="80" 
              y="40" 
              width={medWidth} 
              height="10" 
              rx="5" 
              fill="#ff9500"
              style={{ transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <text x="355" y="50" fill="#ff9500" style={{ fontSize: '12px', fontWeight: 700 }}>{medCount}</text>
          </g>

          {/* Row 3: Low Priority */}
          <g>
            <text x="0" y="80" fill="#86868b" style={{ fontSize: '12px', fontWeight: 700 }}>🟢 Rendah</text>
            <rect x="80" y="70" width="260" height="10" rx="5" fill="#f5f5f7" />
            <rect 
              x="80" 
              y="70" 
              width={lowWidth} 
              height="10" 
              rx="5" 
              fill="#34c759"
              style={{ transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <text x="355" y="80" fill="#86868b" style={{ fontSize: '12px', fontWeight: 700 }}>{lowCount}</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// --- SUB-KOMPONEN 3: NOTIFIKASI PERALIHAN PROYEK ---
function ProjectSwitchCard({ 
  action, 
  projectName 
}: { 
  action: 'create' | 'switch'; 
  projectName: string; 
}) {
  return (
    <div className="genui-card animate-enter" style={{ animationDelay: '0.2s', marginTop: '16px', border: '1px solid rgba(0,71,227,0.12)', background: 'linear-gradient(145deg, #ffffff 0%, #f4f8fe 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{action === 'create' ? '✨' : '🔄'}</span>
        <h4 style={{ fontWeight: 700, fontSize: '15px', color: '#0071e3' }}>
          {action === 'create' ? 'Proyek Baru Aktif' : 'Beralih Proyek'}
        </h4>
      </div>
      <p style={{ fontSize: '14.5px', color: '#1d1d1f', fontWeight: 600 }}>
        {action === 'create' ? `Project "${projectName}" created successfully.` : `You are now in project "${projectName}".`}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
        All of your next task commands will be managed on this project board.
      </p>
    </div>
  );
}

// --- SUB-KOMPONEN 4: DAFTAR PROYEK ---
function ProjectListCard({ 
  projects, 
  activeId, 
  onSwitch 
}: { 
  projects: ProjectInfo[]; 
  activeId: string;
  onSwitch: (id: string) => void;
}) {
  return (
    <div className="genui-card animate-enter" style={{ animationDelay: '0.2s', marginTop: '16px' }}>
      <h4 style={{ fontWeight: 700, fontSize: '15px', color: '#1d1d1f', marginBottom: '12px' }}>📁 Your Projects List</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {projects.map(p => {
          const completionRate = p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
          return (
            <div 
              key={p.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '10px 14px', 
                background: p.id === activeId ? 'rgba(0,71,227,0.04)' : '#f5f5f7', 
                borderRadius: '12px',
                border: p.id === activeId ? '1px solid rgba(0,71,227,0.1)' : '1px solid transparent'
              }}
            >
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', color: p.id === activeId ? '#0071e3' : '#1d1d1f' }}>{p.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.completedCount} of {p.taskCount} tasks ({completionRate}%)</p>
              </div>
              {p.id === activeId ? (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0071e3', background: 'rgba(0,71,227,0.08)', padding: '3px 8px', borderRadius: '8px' }}>Active</span>
              ) : (
                <button 
                  onClick={() => onSwitch(p.id)}
                  style={{
                    border: 'none',
                    background: 'white',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#1d1d1f',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f7'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  Switch
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectNotesCard({ 
  notes, 
  onOpen 
}: { 
  notes: string; 
  onOpen: () => void;
}) {
  const truncated = notes.length > 100 ? notes.slice(0, 100) + '...' : notes;

  return (
    <div className="genui-card animate-enter" style={{ animationDelay: '0.2s', marginTop: '16px', borderRadius: '0px', borderColor: '#E8E8F8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontWeight: 700, fontSize: '15px', color: '#1313BA' }}>📝 Catatan Proyek Diperbarui</h4>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803D', background: '#ECFDF3', padding: '2px 8px' }}>Tersimpan</span>
      </div>
      <p style={{ fontSize: '13px', color: '#6363C6', fontStyle: 'italic', background: '#F4F4FC', padding: '12px', marginBottom: '12px', border: '1px solid #E8E8F8', borderRadius: '0px', whiteSpace: 'pre-wrap' }}>
        "{truncated || 'Catatan kosong'}"
      </p>
      <button 
        onClick={onOpen}
        style={{
          width: '100%',
          border: 'none',
          background: '#1313BA',
          color: 'white',
          padding: '8px',
          borderRadius: '0px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#0E0E8C'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#1313BA'}
      >
        Buka Panel Catatan Lengkap
      </button>
    </div>
  );
}

// --- UTAMA: COMPONENT CHAT ---
export default function Chat() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // User Authentication State
  const [username, setUsername] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Multi-Project States
  const [activeProjectId, setActiveProjectId] = useState('default');
  const [activeProjectName, setActiveProjectName] = useState('Proyek Utama');
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  // Project Notes States
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cek klik di luar dropdown untuk menutup menu proyek
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cek apakah ada user tersimpan di localStorage saat mount
  useEffect(() => {
    const savedUser = localStorage.getItem("cos_username");
    if (savedUser) {
      setUsername(savedUser);
    }
  }, []);

  // Mengambil data proyek dari API
  const loadProjects = async (user: string) => {
    try {
      const response = await fetch('/api/projects', {
        headers: { 'x-username': user }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveProjectId(data.activeProjectId);
        setActiveProjectName(data.activeProjectName);
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Gagal mengambil daftar proyek:", error);
    }
  };

  // Ambil database tugas dan setel pesan selamat datang setelah user login
  useEffect(() => {
    if (!username) return;

    const loadInitialTasks = async () => {
      try {
        const response = await fetch('/api/tasks', {
          headers: { 'x-username': username }
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data tugas:", error);
      }
    };
    
    const loadInitialNotes = async () => {
      try {
        const response = await fetch('/api/notes', {
          headers: { 'x-username': username }
        });
        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes || "");
        }
      } catch (error) {
        console.error("Gagal mengambil data catatan proyek:", error);
      }
    };

    loadInitialTasks();
    loadProjects(username);
    loadInitialNotes();

    setMessages([
      { 
        id: '1', 
        role: 'ai', 
        content: `Hello, ${username}! I am CoS, your personal executive assistant. Try instructing me to generate a daily briefing, simulate a scenario, or analyze your business!` 
      }
    ]);
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // FUNGSI MANUAL: Berpindah Proyek
  const handleSwitchProject = async (projId: string) => {
    if (!username) return;
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username
        },
        body: JSON.stringify({ action: 'switch', projectId: projId })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveProjectId(data.activeProjectId);
        setActiveProjectName(data.activeProjectName);
        setShowProjectDropdown(false);
        
        // Ambil tugas proyek yang baru aktif
        const tasksResponse = await fetch('/api/tasks', {
          headers: { 'x-username': username }
        });
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.tasks || []);
        }
        
        // Ambil catatan proyek yang baru aktif
        const notesResponse = await fetch('/api/notes', {
          headers: { 'x-username': username }
        });
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData.notes || "");
        }

        loadProjects(username); // Sync ulang metadata proyek

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: `Saya telah beralih ke proyek "${data.activeProjectName}".`
        }]);
      }
    } catch (error) {
      console.error("Gagal beralih proyek:", error);
    }
  };

  // FUNGSI MANUAL: Membuat Proyek Baru
  const handleCreateProject = async () => {
    if (!username) return;
    const name = window.prompt("Masukkan nama proyek baru Anda:");
    if (!name || !name.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username
        },
        body: JSON.stringify({ action: 'create', projectName: name.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveProjectId(data.activeProjectId);
        setActiveProjectName(data.activeProjectName);
        setShowProjectDropdown(false);
        setTasks([]); // Proyek baru berawal kosong
        loadProjects(username); // Muat ulang list proyek

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: `New project "${data.activeProjectName}" created successfully and is now active.`
        }]);
      }
    } catch (error) {
      console.error("Failed to create new project:", error);
    }
  };

  // FUNGSI MANUAL: Memperbarui Catatan Proyek
  const handleUpdateNotes = async (newNotes: string) => {
    setNotes(newNotes);
    if (!username) return;
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username
        },
        body: JSON.stringify({ notes: newNotes })
      });
    } catch (error) {
      console.error("Gagal menyimpan catatan proyek:", error);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setLoginError("Username cannot be empty.");
      return;
    }
    if (loginPin && loginPin.length < 4) {
      setLoginError("Security PIN must be at least 4 digits.");
      return;
    }

    const cleanedUser = loginUsername.trim().toLowerCase();
    localStorage.setItem("cos_username", cleanedUser);
    if (loginPin) {
      localStorage.setItem("cos_pin", loginPin);
    }
    setUsername(cleanedUser);
    setLoginError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("cos_username");
    localStorage.removeItem("cos_pin");
    setUsername(null);
    setTasks([]);
    setActiveProjectId('default');
    setActiveProjectName('Proyek Utama');
    setProjects([]);
    setLoginUsername('');
    setLoginPin('');
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username || 'default'
        },
        body: JSON.stringify({ message: userMessage.content, history: messages }),
      });
      
      const data = await response.json();
      
      // Jika AI merender/modifikasi TaskList, kita update state utama kita
      if (data.genUI && data.genUI.componentName === 'TaskList') {
        setTasks(data.genUI.props.items || []);
      }
      // Jika AI membuat atau berpindah proyek, kita sync state header
      else if (data.genUI && data.genUI.componentName === 'ProjectSwitch') {
        setActiveProjectId(data.genUI.props.projectId);
        setActiveProjectName(data.genUI.props.projectName);
        setTasks(data.genUI.props.tasks || []);
        if (username) loadProjects(username);
      }
      // Jika AI memperbarui ProjectNotes
      else if (data.genUI && data.genUI.componentName === 'ProjectNotes') {
        setNotes(data.genUI.props.notes || "");
        setShowNotes(true);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text,
        genUI: data.genUI
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Sorry, a server error occurred.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: 'pending' | 'completed', subtaskId?: string) => {
    const newStatus = (currentStatus === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed';
    
    let updatedTasks: Task[] = tasks.map(t => {
      if (t.id !== taskId) return t;

      if (subtaskId) {
        // Toggle spesifik subtask
        const updatedSubtasks: Subtask[] = (t.subtasks || []).map(st => 
          st.id === subtaskId 
            ? { ...st, status: (st.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' }
            : st
        );
        // Cek apakah semua subtask sudah selesai
        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.status === 'completed');
        return {
          ...t,
          subtasks: updatedSubtasks,
          status: (allDone ? 'completed' : 'pending') as 'pending' | 'completed'
        };
      } else {
        // Toggle main task
        const updatedSubtasks: Subtask[] = (t.subtasks || []).map(st => ({
          ...st,
          status: newStatus
        }));
        return {
          ...t,
          status: newStatus,
          subtasks: updatedSubtasks
        };
      }
    });

    setTasks(updatedTasks);

    // Sinkronkan ke messages list agar checkbox di UI chat bubble tercentang seketika
    setMessages(prev => prev.map(msg => {
      if (msg.genUI && msg.genUI.componentName === 'TaskList') {
        const msgTasks = msg.genUI.props.items || [];
        const updatedMsgTasks = msgTasks.map((t: any) => {
          if (t.id !== taskId) return t;
          if (subtaskId) {
            const updatedSubtasks = (t.subtasks || []).map((st: any) => 
              st.id === subtaskId 
                ? { ...st, status: st.status === 'completed' ? 'pending' : 'completed' }
                : st
            );
            const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st: any) => st.status === 'completed');
            return { ...t, subtasks: updatedSubtasks, status: allDone ? 'completed' : 'pending' };
          } else {
            const updatedSubtasks = (t.subtasks || []).map((st: any) => ({ ...st, status: newStatus }));
            return { ...t, status: newStatus, subtasks: updatedSubtasks };
          }
        });
        return {
          ...msg,
          genUI: {
            ...msg.genUI,
            props: {
              ...msg.genUI.props,
              items: updatedMsgTasks
            }
          }
        };
      }
      return msg;
    }));
    
    // Simpan ke database
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username || 'default'
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      if (username) loadProjects(username); // Sync counts
    } catch (error) {
      console.error("Gagal menyimpan perubahan tugas:", error);
    }
  };

  const handleUpdateDueDate = async (taskId: string, date: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, dueDate: date || undefined } : t);
    setTasks(updatedTasks);

    // Sinkronkan ke messages list
    setMessages(prev => prev.map(msg => {
      if (msg.genUI && msg.genUI.componentName === 'TaskList') {
        const msgTasks = msg.genUI.props.items || [];
        const updatedMsgTasks = msgTasks.map((t: any) => t.id === taskId ? { ...t, dueDate: date || undefined } : t);
        return {
          ...msg,
          genUI: {
            ...msg.genUI,
            props: {
              ...msg.genUI.props,
              items: updatedMsgTasks
            }
          }
        };
      }
      return msg;
    }));

    // Simpan ke database
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username || 'default'
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      if (username) loadProjects(username); // Sync counts
    } catch (error) {
      console.error("Gagal menyimpan tanggal jatuh tempo:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
     const updatedTasks = tasks.filter(t => t.id !== taskId);
     setTasks(updatedTasks);

     // Sinkronkan ke messages list
     setMessages(prev => prev.map(msg => {
       if (msg.genUI && msg.genUI.componentName === 'TaskList') {
         const msgTasks = msg.genUI.props.items || [];
         const updatedMsgTasks = msgTasks.filter((t: any) => t.id !== taskId);
         return {
           ...msg,
           genUI: {
             ...msg.genUI,
             props: {
               ...msg.genUI.props,
               items: updatedMsgTasks
             }
           }
         };
       }
       return msg;
     }));
     
     // Simpan perubahan ke database
     try {
       await fetch('/api/tasks', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'x-username': username || 'default'
         },
         body: JSON.stringify({ tasks: updatedTasks }),
       });
        if (username) loadProjects(username); // Sync counts
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
   };

   // --- RENDER LOGIN VIEW ---
   if (!username) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        padding: '24px'
      }}>
        <div className="animate-enter" style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          border: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Logo Icon */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
              <path d="M2 12H22" />
              <path d="M12 2C14.5013 4.73831 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2617 12 22C9.49872 19.2617 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73831 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Future Chief of Staff
          </h2>
          <p style={{ fontSize: '12px', color: '#4B5563', textAlign: 'center', marginBottom: '24px', lineHeight: 1.45 }}>
            AI Executive Copilot for Founder & C-Suite.<br />Sign in with your username below.
          </p>

          <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#111827' }}>Username</label>
              <input
                type="text"
                placeholder="Example: frits, guest, marketing"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: '#FFFFFF',
                  color: '#111827'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#111827', display: 'flex', justifyContent: 'space-between' }}>
                <span>Security PIN</span>
                <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '10px' }}>Optional</span>
              </label>
              <input
                type="password"
                placeholder="4-digit number (e.g.: 1234)"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: '#FFFFFF',
                  color: '#111827'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {loginError && (
              <p style={{ color: '#DC2626', fontSize: '11px', fontWeight: 500, marginTop: '4px' }}>
                ⚠️ {loginError}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '8px',
                boxShadow: '0 1px 2px rgba(59, 130, 246, 0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
            >
              Sign In
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#9CA3AF', lineHeight: 1.45, margin: 0 }}>
              🔒 Databases are stored locally per-user. An optional PIN can be used for basic local privacy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN CHAT VIEW ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Apple-Style Sticky Nav Bar Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(252, 252, 253, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            background: 'linear-gradient(135deg, #111113 0%, #68686d 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Future Chief of Staff (CoS)
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Manual Project Selector Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: 'rgba(0, 113, 227, 0.08)',
                color: '#0071e3',
                border: 'none',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>📁 {activeProjectName}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            
            {showProjectDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '220px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 100
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Daftar Proyek
                </div>
                
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchProject(p.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: p.id === activeProjectId ? 'rgba(0,0,0,0.03)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: p.id === activeProjectId ? 700 : 500,
                        color: p.id === activeProjectId ? '#1d1d1f' : 'var(--text-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (p.id !== activeProjectId) e.currentTarget.style.background = '#f5f5f7';
                      }}
                      onMouseLeave={(e) => {
                        if (p.id !== activeProjectId) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: '10.5px', background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                        {p.taskCount}
                      </span>
                    </button>
                  ))}
                </div>
                
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    onClick={handleCreateProject}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'transparent',
                      color: '#0071e3',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e8f2fc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Proyek Baru...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Active Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#1d1d1f'
          }}>
            <span className="animate-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#34c759', borderRadius: '50%' }}></span>
            <span style={{ textTransform: 'capitalize' }}>{username}</span>
          </div>

          {/* Notes Toggle Button */}
          <button 
            onClick={() => setShowNotes(!showNotes)}
            style={{
              background: showNotes ? 'rgba(19, 19, 186, 0.06)' : 'transparent',
              border: 'none',
              color: showNotes ? '#1313BA' : '#6363C6',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              marginRight: '8px'
            }}
            onMouseEnter={(e) => {
              if (!showNotes) e.currentTarget.style.background = 'rgba(99, 99, 198, 0.08)';
            }}
            onMouseLeave={(e) => {
              if (!showNotes) e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Catatan
          </button>

          {/* Dashboard Link button */}
          <Link 
            href="/dashboard"
            style={{
              textDecoration: 'none',
              background: 'transparent',
              border: 'none',
              color: '#0071e3',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              marginRight: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 113, 227, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Dashboard
          </Link>

          {/* Logout button */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ff3b30',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar
          </button>
        </div>
      </header>

      {/* Area Chat */}
      <div className="chat-container" style={{ paddingTop: '24px', flex: 1, paddingBottom: '120px' }}>
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`chat-bubble animate-enter ${msg.role}`} style={{ animationDelay: `${idx * 0.05}s` }}>
            {msg.content}
            
            {/* RENDER GENUI 1: DAFTAR TUGAS INTERAKTIF */}
            {msg.genUI && msg.genUI.componentName === 'TaskList' && (
                <TaskListCard 
                  items={msg.genUI.props.items || []} 
                  onToggle={handleToggleTask} 
                  onDelete={handleDeleteTask} 
                  onUpdateDueDate={handleUpdateDueDate}
                />
            )}
            
            {/* RENDER GENUI 2: SUMMARY PROYEK DENGAN GRAFIK SVG */}
            {msg.genUI && msg.genUI.componentName === 'ProjectSummary' && (
               <ProjectSummaryCard 
                 projectName={msg.genUI.props.projectName} 
                 summary={msg.genUI.props.summary} 
                 status={msg.genUI.props.status} 
                 allTasks={tasks} 
               />
            )}

            {/* RENDER GENUI 3: PROJECT SWITCH */}
            {msg.genUI && msg.genUI.componentName === 'ProjectSwitch' && (
               <ProjectSwitchCard 
                 action={msg.genUI.props.action} 
                 projectName={msg.genUI.props.projectName} 
               />
            )}

            {/* RENDER GENUI 4: DAFTAR PROYEK */}
            {msg.genUI && msg.genUI.componentName === 'ProjectList' && (
               <ProjectListCard 
                 projects={msg.genUI.props.projects || []} 
                 activeId={activeProjectId} 
                 onSwitch={handleSwitchProject} 
               />
            )}

            {/* RENDER GENUI 5: CATATAN PROYEK */}
            {msg.genUI && msg.genUI.componentName === 'ProjectNotes' && (
               <ProjectNotesCard 
                 notes={msg.genUI.props.notes} 
                 onOpen={() => setShowNotes(true)}
               />
            )}

            {/* RENDER GENUI 6: BRIEFING EKSEKUTIF HARIAN */}
            {msg.genUI && msg.genUI.componentName === 'BriefingCard' && (
               <BriefingCard 
                 highlights={msg.genUI.props.highlights || []}
                 metrics={msg.genUI.props.metrics || {}}
                 agenda={msg.genUI.props.agenda || []}
                 reasoning_trail={msg.genUI.props.reasoning_trail || {}}
               />
            )}

            {/* RENDER GENUI 7: DRAF KEPUTUSAN STRATEGIS */}
            {msg.genUI && msg.genUI.componentName === 'DecisionLogCard' && (
               <DecisionLogCard 
                 title={msg.genUI.props.title} 
                 description={msg.genUI.props.description} 
                 decision_made={msg.genUI.props.decision_made} 
                 rationale={msg.genUI.props.rationale} 
                 assumptions={msg.genUI.props.assumptions || []} 
                 alternatives_considered={msg.genUI.props.alternatives_considered || []} 
                 confidence_score={msg.genUI.props.confidence_score} 
                 data_sources={msg.genUI.props.data_sources || []} 
                 tags={msg.genUI.props.tags || []} 
               />
            )}

            {/* RENDER GENUI 8: SCENARIO PROJECTION CHART */}
            {msg.genUI && msg.genUI.componentName === 'ScenarioChart' && (
               <ScenarioChart 
                 scenario_type={msg.genUI.props.scenario_type} 
                 title={msg.genUI.props.title} 
                 summary_metrics={msg.genUI.props.summary_metrics || {}} 
                 projections={msg.genUI.props.projections || []} 
                 reasoning_trail={msg.genUI.props.reasoning_trail || {}} 
               />
            )}

            {/* RENDER GENUI 9: BOARD & INVESTOR REPORT DRAFT */}
            {msg.genUI && msg.genUI.componentName === 'ReportCard' && (
               <ReportCard 
                 title={msg.genUI.props.title} 
                 report_type={msg.genUI.props.report_type} 
                 period={msg.genUI.props.period} 
                 content_markdown={msg.genUI.props.content_markdown} 
               />
            )}

            {/* RENDER GENUI 10: MARKET INTELLIGENCE COMPETITOR DIGEST */}
            {msg.genUI && msg.genUI.componentName === 'MarketDigestCard' && (
               <MarketDigestCard 
                 query={msg.genUI.props.query} 
                 results={msg.genUI.props.results || []} 
                 insights={msg.genUI.props.insights} 
                 cached_at={msg.genUI.props.cached_at} 
                 cache_hit={msg.genUI.props.cache_hit} 
               />
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble ai animate-enter" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
            <span className="animate-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', margin: '0 2px' }}></span>
            <span className="animate-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', margin: '0 2px', animationDelay: '0.2s' }}></span>
            <span className="animate-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', margin: '0 2px', animationDelay: '0.4s' }}></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="input-wrapper" style={{ left: 0, right: 0, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        {/* Quick Actions / Suggested Prompts */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '4px 8px 8px 8px',
          scrollbarWidth: 'none', // Hide scrollbar for clean look
          msOverflowStyle: 'none',
          width: '100%',
          maxWidth: 'var(--max-width)',
          pointerEvents: 'auto',
          alignSelf: 'center',
          boxSizing: 'border-box'
        }} className="quick-actions-container">
          <style>{`
            .quick-actions-container::-webkit-scrollbar {
              display: none;
            }
            .quick-action-btn {
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(0, 0, 0, 0.08);
              border-radius: 20px;
              padding: 6px 12px;
              font-size: 11px;
              font-weight: 700;
              color: #48484a;
              cursor: pointer;
              white-space: nowrap;
              transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
              box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            }
            .quick-action-btn:hover {
              background: #0071e3;
              color: white;
              border-color: #0071e3;
              transform: translateY(-1px);
              box-shadow: 0 4px 10px rgba(0,113,227,0.15);
            }
            .quick-action-btn:active {
              transform: translateY(0);
            }
          `}</style>
          
          <button 
            type="button"
            className="quick-action-btn"
            onClick={() => setInput("Generate daily briefing")}
            title="Sintesis data bisnis harian Anda"
          >
            📊 Daily Briefing
          </button>
          
          <button 
            type="button"
            className="quick-action-btn"
            onClick={() => setInput("What if we hire 2 developers with annual salary of IDR 120 million?")}
            title="Simulasikan dampak rekrutmen staf baru"
          >
            📈 Hire 2 Devs (What-If)
          </button>

          <button 
            type="button"
            className="quick-action-btn"
            onClick={() => setInput("What if we increase selling price by 10%?")}
            title="Simulasikan kenaikan harga produk"
          >
            💰 Price +10% (What-If)
          </button>

          <button 
            type="button"
            className="quick-action-btn"
            onClick={() => setInput("Generate board report draft for Q2 2026")}
            title="Buat draf laporan kinerja formal"
          >
            📄 Board Report
          </button>

          <button 
            type="button"
            className="quick-action-btn"
            onClick={() => setInput("Search competitor SaaS pricing")}
            title="Riset tren pasar dan kompetitor"
          >
            🔍 Competitor Research
          </button>

          <button 
            type="button"
            className="quick-action-btn"
            onClick={() => setInput("Please record my task: Review marketing plan Q3 with deadline 2026-07-15 and priority High")}
            title="Tambah tugas baru ke proyek aktif"
          >
            📝 Add Task
          </button>
        </div>

        <form onSubmit={handleSubmit} className="input-box">
          <input
            type="text"
            className="chat-input"
            placeholder="Example: 'Please record my tasks today: Buy coffee, check email...'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>

      {/* RENDER MODAL: CATATAN PROYEK WIKI OVERLAY (per modal.md specs) */}
      {showNotes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', // Scrim overlay
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          {/* Modal Panel (radius-xxl 0px, borderless, elevation-none) */}
          <div style={{
            width: '100%',
            maxWidth: '640px',
            backgroundColor: '#FFFFFF',
            borderRadius: '0px',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            padding: '24px',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingBottom: '16px', 
              borderBottom: '1px solid #E8E8F8', 
              marginBottom: '16px' 
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1313BA', letterSpacing: '-0.02em', margin: 0 }}>
                  📝 Project Notes
                </h3>
                <span style={{ fontSize: '12px', color: '#9090CE', marginTop: '2px', display: 'block' }}>
                  Wiki & memo for project: <strong>{activeProjectName}</strong>
                </span>
              </div>
              
              <button 
                onClick={() => setShowNotes(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#9090CE',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: '18px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1313BA'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9090CE'}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <textarea
                value={notes}
                onChange={(e) => handleUpdateNotes(e.target.value)}
                placeholder="Write meeting summaries, tech specs, API details, or other important notes here... The AI assistant will also write here when requested."
                style={{
                  width: '100%',
                  height: '350px',
                  padding: '16px',
                  fontSize: '14px',
                  color: '#6363C6',
                  lineHeight: '1.6',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E8F8',
                  borderRadius: '0px',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1313BA';
                  e.target.style.boxShadow = '0 0 0 3px #CACAF0';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8E8F8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingTop: '16px', 
              borderTop: '1px solid #E8E8F8', 
              marginTop: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#15A34A', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '11px', color: '#9090CE', fontWeight: 500 }}>
                  Catatan disimpan secara otomatis.
                </span>
              </div>

              <button
                onClick={() => setShowNotes(false)}
                style={{
                  backgroundColor: '#1313BA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0E0E8C'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1313BA'}
              >
                Selesai
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
