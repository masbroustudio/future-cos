'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [username, setUsername] = useState<string | null>(null);
  
  // Interactive FAQ Accordion State
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Mock Workspace Interactive Demo States
  const [demoTasks, setDemoTasks] = useState([
    { id: 't1', title: 'Integrate Gemini 2.5 Flash LLM', status: 'completed', priority: 'High', dueDate: '2026-07-15' },
    { id: 't2', title: 'Audit database security & Firestore rules', status: 'pending', priority: 'High', dueDate: '2026-07-20' },
    { id: 't3', title: 'Design premium Sleek design system', status: 'pending', priority: 'Medium', dueDate: '2026-07-18' }
  ]);
  const [demoNotes, setDemoNotes] = useState('Project Specification:\n- Development port active on :3000\n- Utilizes Sleek minimal design system\n- Live Firestore emulator configured');
  const [demoInput, setDemoInput] = useState('');
  const [demoChat, setDemoChat] = useState([
    { role: 'user', content: 'Generate a project spec summary' },
    { role: 'ai', content: 'Certainly! I have summarized the project spec (Sleek design system, port 3000, active emulator) and saved it to the Project Wiki on the right.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('cos_username');
    if (savedUser) {
      setUsername(savedUser);
    }
  }, []);

  const toggleDemoTask = (id: string) => {
    setDemoTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    ));
  };

  const handleDemoSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim() || isTyping) return;

    const userMsg = { role: 'user', content: demoInput };
    setDemoChat(prev => [...prev, userMsg]);
    const inputSaved = demoInput.toLowerCase();
    setDemoInput('');
    setIsTyping(true);

    setTimeout(() => {
      let aiContent = 'I have processed your request and updated the workspace state.';
      if (inputSaved.includes('task') || inputSaved.includes('todo')) {
        const newTask = {
          id: `t${Date.now()}`,
          title: demoInput,
          status: 'pending' as const,
          priority: 'High' as const,
          dueDate: '2026-07-22'
        };
        setDemoTasks(prev => [...prev, newTask]);
        aiContent = `Task "${demoInput}" has been added to the board with High priority!`;
      } else if (inputSaved.includes('note') || inputSaved.includes('wiki') || inputSaved.includes('record')) {
        setDemoNotes(prev => prev + `\n- ${demoInput}`);
        aiContent = `Note "${demoInput}" has been added to the Project Wiki notes.`;
      }
      
      setDemoChat(prev => [...prev, { role: 'ai', content: aiContent }]);
      setIsTyping(false);
    }, 1200);
  };

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: '"Inter", -apple-system, sans-serif', color: '#111827' }}>
      
      {/* --- HEADER NAVBAR (Sleek Blur) --- */}
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
          {/* Logo Mark */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span style={{ 
              fontWeight: 600, 
              fontSize: '16px', 
              color: '#111827', 
              letterSpacing: '-0.02em' 
            }}>
              Future CoS
            </span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" className="nav-link" style={{
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              color: '#4B5563',
              transition: 'color 0.15s ease'
            }}>
              Dashboard
            </Link>
            <Link href="/chat" className="nav-link" style={{
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              color: '#4B5563',
              transition: 'color 0.15s ease'
            }}>
              Workspace
            </Link>

            {/* CTA Button */}
            <Link href={username ? "/dashboard" : "/chat"} style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#FFFFFF',
              backgroundColor: '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(59, 130, 246, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3B82F6';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(59, 130, 246, 0.1)';
            }}
            >
              {username ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </nav>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section style={{ 
        backgroundColor: '#FFFFFF', 
        padding: '80px 24px 64px 24px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', zIndex: 10 }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: '#3B82F6', 
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            display: 'inline-block',
            marginBottom: '24px'
          }}>
            AI-Powered Executive Copilot
          </span>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 600, 
            color: '#111827', 
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '24px'
          }}>
            Accelerate Strategic Decisions with Future Chief of Staff
          </h1>
          <p style={{ 
            fontSize: '16px', 
            fontWeight: 400, 
            color: '#4B5563', 
            lineHeight: 1.6, 
            maxWidth: '600px',
            margin: '0 auto 32px auto',
            letterSpacing: '-0.01em'
          }}>
            Integrate Gemini directly into your workspace. Automate executive briefings, simulate scenario impacts on runway, compile board reports, and monitor competitors from a single, unified command canvas.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '48px' }}>
            <Link href={username ? "/dashboard" : "/chat"} style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#FFFFFF',
              backgroundColor: '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
            >
              {username ? 'Go to Dashboard' : 'Launch Workspace'}
            </Link>
            <a href="#demo" style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#111827',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
            >
              Interactive Demo
            </a>
          </div>
        </div>

        {/* --- LIVE INTERACTIVE WORKSPACE MOCKUP (Precision spacing) --- */}
        <div id="demo" style={{ 
          marginTop: '48px', 
          width: '100%', 
          maxWidth: '1000px', 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E5E7EB', 
          borderRadius: '8px', 
          boxShadow: '0 12px 32px rgba(0,0,0,0.04)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          height: '480px',
          overflow: 'hidden'
        }}>
          {/* Mock Window Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 20px', 
            borderBottom: '1px solid #E5E7EB', 
            backgroundColor: '#F9FAFB' 
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '50%' }}></span>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '50%' }}></span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#4B5563', letterSpacing: '0.05em' }}>
              INTERACTIVE DEMO CANVAS
            </div>
            <div style={{ width: '40px' }}></div>
          </div>

          {/* Split Pane Demo Layout */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            {/* Left Pane: Chat Workspace (60%) */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', position: 'relative' }}>
              
              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {demoChat.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 500, color: '#9CA3AF', marginBottom: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                      {msg.role === 'user' ? 'You' : 'CoS Copilot'}
                    </span>
                    <div style={{
                      padding: '10px 14px',
                      backgroundColor: msg.role === 'user' ? 'rgba(59, 130, 246, 0.08)' : '#F9FAFB',
                      color: msg.role === 'user' ? '#1E40AF' : '#111827',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: msg.role === 'user' ? 'rgba(59, 130, 246, 0.15)' : '#E5E7EB',
                      fontSize: '12px',
                      lineHeight: 1.45
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', padding: '10px 14px', backgroundColor: '#F9FAFB', color: '#9CA3AF', fontSize: '11px', fontStyle: 'italic', borderRadius: '6px' }}>
                    AI is writing...
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleDemoSend} style={{ padding: '12px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Try: 'Add task: Finalize pricing model' or type a project note..."
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#111827'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                <button type="submit" style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                >
                  Send
                </button>
              </form>
            </div>

            {/* Middle Pane: Task Checklist (25%) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', padding: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Task List
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {demoTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: task.status === 'completed' ? '#F9FAFB' : '#FFFFFF',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleDemoTask(task.id)}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: task.status === 'completed' ? '#9CA3AF' : '#111827',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 600, padding: '1px 4px', borderRadius: '4px', backgroundColor: task.priority === 'High' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(217, 119, 6, 0.08)', color: task.priority === 'High' ? '#DC2626' : '#D97706' }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: '8px', color: '#9CA3AF' }}>
                          📅 {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane: Project Notes (20%) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Project Wiki
              </h4>
              <textarea
                value={demoNotes}
                onChange={(e) => setDemoNotes(e.target.value)}
                style={{
                  flex: 1,
                  width: '100%',
                  padding: '8px',
                  fontSize: '11px',
                  color: '#4B5563',
                  lineHeight: '1.4',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  resize: 'none',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '8px', color: '#9CA3AF', marginTop: '6px', display: 'block' }}>
                💾 Auto-save active
              </span>
            </div>

          </div>
        </div>

      </section>

      {/* --- THE FIVE PILLARS OF COS SECTION --- */}
      <section style={{ 
        padding: '80px 24px', 
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ maxWidth: '600px', marginBottom: '48px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: '#3B82F6', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '8px'
            }}>
              Core Architecture
            </span>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 600, 
              color: '#111827', 
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Five Pillars of Professional C-Suite Assistance
            </h2>
            <p style={{ fontSize: '14px', color: '#4B5563', marginTop: '8px', lineHeight: 1.5 }}>
              Designed as a premium system dashboard running on the Google Cloud Free Tier. Every feature undergoes a strict agentic loop (Plan &rarr; Select Tools &rarr; Synthesize &rarr; Self-Reflect).
            </p>
          </div>

          {/* Pillars Grid */}
          {/* Bento Grid */}
          <div className="bento-grid">
            
            {/* Pillar 1: Executive Daily Briefings - Large (span 2) */}
            <div className="pillar-card bento-item-large" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '16px',
                    borderRadius: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Executive Daily Briefings</h3>
                  <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                    Consolidates financial metrics, CRM pipelines, and calendar alerts into a clean executive summary at the start of your day. Automatically highlights anomalies.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <span style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 600, background: 'rgba(59, 130, 246, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>CRM Sync</span>
                  <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 600, background: 'rgba(22, 163, 74, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>Bank Feeds</span>
                </div>
              </div>

              {/* Visual Mockup inside Card */}
              <div style={{ 
                flex: 1, 
                minWidth: '240px', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px', 
                padding: '16px', 
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                fontSize: '11px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F3F4F6', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>☀️ Morning Briefing</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontWeight: 600, fontSize: '9px' }}>
                    <span style={{ width: '5px', height: '5px', backgroundColor: '#16A34A', borderRadius: '50%' }}></span>
                    UPDATED
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', marginBottom: '4px' }}>
                      <span>Runway Health</span>
                      <span style={{ color: '#111827', fontWeight: 600 }}>8.2 Months (Safe)</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#F3F4F6', borderRadius: '2px' }}>
                      <div style={{ width: '68%', height: '100%', backgroundColor: '#16A34A', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: '8px', color: '#4B5563' }}>
                    <span>Active Pipeline</span>
                    <span style={{ color: '#111827', fontWeight: 600 }}>IDR 450M (12 Deals)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', borderTop: '1px solid #F3F4F6', paddingTop: '8px', color: '#DC2626', background: 'rgba(220, 38, 38, 0.02)', padding: '6px', borderRadius: '4px' }}>
                    <span>🚨</span>
                    <span><strong>Anomaly:</strong> Competitor X raised basic plan pricing by 20% today.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Scenario Simulator - Small (span 1) */}
            <div className="pillar-card bento-item-small" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px',
                  borderRadius: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Scenario Simulator ("What-If")</h3>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                  Model the future impact of hiring or pricing decisions. Uses sandbox logic to project cash runway without touching live databases.
                </p>
              </div>

              {/* Sparkline Area Chart Mockup */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Runway Impact</span>
                  <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '12px' }}>+4.2 Months</span>
                </div>
                {/* SVG Area Chart with Gradient */}
                <svg width="100%" height="32" viewBox="0 0 100 32" fill="none" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16A34A" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#16A34A" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0 32 C20 32, 35 24, 55 12 T 100 2" fill="url(#chartGrad)"/>
                  <path d="M0 32 C20 32, 35 24, 55 12 T 100 2" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Pillar 3: Board & Investor Reporting - Small (span 1) */}
            <div className="pillar-card bento-item-small" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px',
                  borderRadius: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Board & Investor Reports</h3>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                  Generate professional Markdown reports compile MRR, Cash runways, and decisions automatically. Download with a single click.
                </p>
              </div>

              {/* Action Item Compilation Mockup */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontWeight: 600 }}>
                  <span>✓</span> <span>Runway calculated</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
                  <span style={{ fontWeight: 500, color: '#4B5563' }}>📄 Board_Q2.md</span>
                  <span style={{ color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}>Download</span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Market Intel Digest - Small (span 1) */}
            <div className="pillar-card bento-item-small" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px',
                  borderRadius: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Market Intel Digest</h3>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                  Keep track of competitor pricing models and industry changes. Saves API quota through custom caching layers.
                </p>
              </div>

              {/* Competitor Feed Mockup */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                fontSize: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0071e3', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold' }}>X</span>
                    Competitor X
                  </span>
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>$59 (+$10)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '6px' }}>
                  <span style={{ color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16a34a', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold' }}>Y</span>
                    Competitor Y
                  </span>
                  <span style={{ color: '#4B5563', fontWeight: 500 }}>$19 (Static)</span>
                </div>
              </div>
            </div>

            {/* Pillar 5: Secure Document Vault & RAG - Small (span 1) */}
            <div className="pillar-card bento-item-small" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px',
                  borderRadius: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Secure Document Vault</h3>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                  Upload pitch decks, spreadsheets, or private memos. The AI uses semantic RAG search to answer strategic queries instantly.
                </p>
              </div>

              {/* Secure upload mockup */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#4B5563' }}>📊 Q1_Revenue.xlsx</span>
                  <span style={{ color: '#16A34A', fontWeight: 600 }}>SECURE</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#F3F4F6', borderRadius: '2px' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#16A34A', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>

            {/* Pillar 6: Decision Logs & Audit Trail - Full (span 3) */}
            <div className="pillar-card bento-item-full" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '16px',
                    borderRadius: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 11l3 3 6-6" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Decision Logs & Audit Trail</h3>
                  <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
                    Maintains an immutable, timestamped ledger of board-level strategic choices. Documents the reasoning, key assumptions, forecasted runway impact, and confidence rates behind every pivot.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <span style={{ fontSize: '10px', color: '#111827', fontWeight: 600, border: '1px solid #E5E7EB', padding: '2px 8px', borderRadius: '4px' }}>Immutable Ledger</span>
                  <span style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 600, border: '1px solid #E5E7EB', padding: '2px 8px', borderRadius: '4px' }}>SHA-256 Verified</span>
                </div>
              </div>

              {/* Audit log visual mockup table (expanded for 3-columns) */}
              <div style={{
                flex: 1.5,
                minWidth: '320px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontWeight: 600, color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '8px' }}>
                  <span>📋 Recent Strategic Decisions</span>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(22, 163, 74, 0.08)', color: '#16A34A', fontWeight: 600 }}>SYNCED</span>
                </div>
                
                {/* Entry 1 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#9CA3AF', width: '70px' }}>10 mins ago</span>
                  <span style={{ color: '#111827', fontWeight: 500, flex: 1 }}>Raised pricing tier by 20%</span>
                  <span style={{ color: '#16A34A', fontWeight: 600 }}>+4.2m Runway</span>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', fontWeight: 600 }}>94% Conf</span>
                </div>

                {/* Entry 2 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
                  <span style={{ color: '#9CA3AF', width: '70px' }}>2 hrs ago</span>
                  <span style={{ color: '#111827', fontWeight: 500, flex: 1 }}>Hired Senior Backend Developer</span>
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>-1.8m Runway</span>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', fontWeight: 600 }}>88% Conf</span>
                </div>

                {/* Entry 3 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
                  <span style={{ color: '#9CA3AF', width: '70px' }}>Yesterday</span>
                  <span style={{ color: '#111827', fontWeight: 500, flex: 1 }}>Shifted strategy to B2B enterprise</span>
                  <span style={{ color: '#4B5563' }}>Neutral Impact</span>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', fontWeight: 600 }}>92% Conf</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- GENERATIVE UI SHOWCASE SECTION --- */}
      <section style={{ 
        padding: '80px 24px', 
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
          
          {/* Visual Showcase */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Prompt Input</span>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#4B5563', margin: '6px 0 0 0', fontStyle: 'italic' }}>
                "Draft a report for investors regarding our Q2 progress."
              </p>
            </div>

            {/* Simulated GenUI Card Output */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #3B82F6',
              padding: '24px',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.05)'
            }}>
              {/* Badge */}
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '8px',
                fontWeight: 600,
                color: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                ✨ RENDERED BY GENUI
              </span>

              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                📋 Investor Performance Report
              </h4>

              {/* Task list simulation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#4B5563' }}>
                  <span style={{ color: '#16A34A', fontWeight: 'bold' }}>✓</span>
                  <span>Financial Health: MRR at IDR 180M (Cash Runway: 8.2 Months)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#4B5563' }}>
                  <span style={{ color: '#16A34A', fontWeight: 'bold' }}>✓</span>
                  <span>CRM Growth: 12 Active Pipeline Deals (Value: IDR 450M)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text block explanation */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generative UI Engine</span>
            <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginTop: '8px', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              Dynamic Interfaces Born from Natural Conversation
            </h2>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5, marginBottom: '20px' }}>
              Unlike traditional chatbots that output rigid markdown summaries, Future CoS dynamically renders interactive, live, and editable UI components right inside your chat stream.
            </p>
            <ul style={{ paddingLeft: '20px', color: '#4B5563', fontSize: '13px', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Direct Interaction</strong>: Approve decisions, copy drafts, or force refresh competitor data directly on visual cards.</li>
              <li><strong>Visual Precision</strong>: Generates micro-charts, logs, and timelines calculated by backend services.</li>
              <li><strong>State Synchronization</strong>: Interactive states are automatically synchronized back to the Firestore database.</li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- STATISTICS SECTION --- */}
      <section style={{ 
        padding: '80px 24px', 
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
          
          {/* Text block */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engine Performance</span>
            <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginTop: '8px', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              Real-time Analysis & High-Speed Synthesis
            </h2>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5, marginBottom: '24px' }}>
              Succeeding in executive workflows requires speed and accuracy. Our implementation maps calculations to a Python sandbox, skipping LLM hallucination for numbers.
            </p>

            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#3B82F6' }}>98%</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginTop: '4px' }}>Task Completion Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#3B82F6' }}>&lt; 1.5s</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginTop: '4px' }}>AI Agent Response Latency</div>
              </div>
            </div>
          </div>

          {/* Static Chart Mockup */}
          <div style={{ flex: 1, minWidth: '300px', border: '1px solid #E5E7EB', padding: '24px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>📊 Active Project Task Distribution</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#DC2626', fontWeight: 500 }}>🔥 High Priority</span>
                  <span style={{ color: '#4B5563' }}>12 Tasks</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ width: '80%', height: '100%', backgroundColor: '#DC2626', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#D97706', fontWeight: 500 }}>⚡ Medium Priority</span>
                  <span style={{ color: '#4B5563' }}>18 Tasks</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ width: '60%', height: '100%', backgroundColor: '#D97706', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#3B82F6', fontWeight: 500 }}>🟢 Low Priority</span>
                  <span style={{ color: '#4B5563' }}>8 Tasks</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ width: '40%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FAQ ACCORDION SECTION (Sleek Clean Style) --- */}
      <section style={{ 
        padding: '80px 24px', 
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ marginBottom: '48px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FAQ</span>
            <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginTop: '8px', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
          </div>

          {/* Accordion Grouped Container */}
          <div style={{ 
            border: '1px solid #E5E7EB', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: '#FFFFFF'
          }}>
            {[
              {
                q: "How does the AI assistant break down complex tasks?",
                a: "When you send a high-level task instruction (e.g. 'Audit competitor SEO'), Gemini analyzes the context and splits the task into structural, pending subtask checklists automatically, specifying their category and priority."
              },
              {
                q: "Where is my project data stored?",
                a: "For local execution, your active tasks and notes are kept in local JSON databases and browser storage. If deployed, they are saved securely in Firestore databases scoped to your authenticated Firebase user ID."
              },
              {
                q: "Can I directly modify task deadlines?",
                a: "Yes! The deadline badges in the task list function as interactive date pickers. You can click on the badge to choose a new due date directly."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} style={{ 
                  borderBottom: idx !== 2 ? '1px solid #E5E7EB' : 'none',
                  backgroundColor: isOpen ? '#F9FAFB' : 'transparent',
                  transition: 'background-color 0.15s ease'
                }}>
                  {/* Accordion Trigger Row */}
                  <button 
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      outline: 'none'
                    }}
                  >
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 500, 
                      color: isOpen ? '#3B82F6' : '#111827',
                      transition: 'color 0.15s ease'
                    }}>
                      {faq.q}
                    </span>
                    {/* Chevron Indicator */}
                    <svg 
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpen ? '#3B82F6' : '#9CA3AF'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease, stroke 0.15s ease',
                        flexShrink: 0
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Accordion Panel Content */}
                  <div style={{
                    maxHeight: isOpen ? '120px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <div style={{ padding: '0 20px 16px 20px', fontSize: '12px', color: '#4B5563', lineHeight: 1.5 }}>
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ 
        backgroundColor: '#FFFFFF', 
        borderTop: '1px solid #E5E7EB',
        color: '#4B5563', 
        padding: '48px 24px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '16px' 
        }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827', letterSpacing: '-0.02em' }}>Future Chief of Staff</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/dashboard" className="footer-link" style={{ textDecoration: 'none', color: '#9CA3AF', fontSize: '12px', transition: 'color 0.15s' }}>Dashboard</Link>
            <Link href="/chat" className="footer-link" style={{ textDecoration: 'none', color: '#9CA3AF', fontSize: '12px', transition: 'color 0.15s' }}>Workspace</Link>
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>
            &copy; 2026 Future Chief of Staff (CoS). Designed with Sleek Design System.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .nav-link:hover {
          color: #3B82F6 !important;
        }
        .footer-link:hover {
          color: #111827 !important;
        }
        .pillar-card:hover {
          border-color: #3B82F6 !important;
          transform: translateY(-1px);
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%;
        }
        .bento-item-large {
          grid-column: span 2;
        }
        .bento-item-small {
          grid-column: span 1;
        }
        .bento-item-full {
          grid-column: span 3;
        }
        @media (max-width: 768px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-item-large, .bento-item-full {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
