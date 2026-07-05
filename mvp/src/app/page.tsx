'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [username, setUsername] = useState<string | null>(null);
  
  // Interactive FAQ Accordion State
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Mock Workspace Interactive Demo States
  const [demoTasks, setDemoTasks] = useState([
    { id: 't1', title: 'Integrasi API Gemini 2.5', status: 'completed', priority: 'High', dueDate: '2026-07-15' },
    { id: 't2', title: 'Audit keamanan sistem database', status: 'pending', priority: 'High', dueDate: '2026-07-20' },
    { id: 't3', title: 'Mendesain layout dashboard baru', status: 'pending', priority: 'Medium', dueDate: '2026-07-18' }
  ]);
  const [demoNotes, setDemoNotes] = useState('Spesifikasi Proyek:\n- Port server local berjalan di 3000\n- Menggunakan sistem desain TypeUI Atlas\n- Database auto-save diaktifkan');
  const [demoInput, setDemoInput] = useState('');
  const [demoChat, setDemoChat] = useState([
    { role: 'user', content: 'Tolong buatkan ringkasan spec proyek kita' },
    { role: 'ai', content: 'Tentu! Spesifikasi proyek menggunakan TypeUI Atlas, server port 3000, dan database auto-save telah saya tulis ke Catatan Proyek di sebelah kanan.' }
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
      let aiContent = 'Saya telah menerima instruksi Anda. Mengubah daftar tugas...';
      if (inputSaved.includes('tugas') || inputSaved.includes('task')) {
        const newTask = {
          id: `t${Date.now()}`,
          title: demoInput,
          status: 'pending' as const,
          priority: 'High' as const,
          dueDate: '2026-07-22'
        };
        setDemoTasks(prev => [...prev, newTask]);
        aiContent = `Tugas baru "${demoInput}" telah ditambahkan ke daftar tugas dengan prioritas High!`;
      } else if (inputSaved.includes('catat') || inputSaved.includes('notes')) {
        setDemoNotes(prev => prev + `\n- ${demoInput}`);
        aiContent = `Informasi "${demoInput}" telah ditambahkan ke Catatan Proyek.`;
      }
      
      setDemoChat(prev => [...prev, { role: 'ai', content: aiContent }]);
      setIsTyping(false);
    }, 1500);
  };

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      
      {/* --- HEADER NAVBAR (Translucent with blur per specs) --- */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
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
          {/* Logo Mark */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1313BA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span style={{ 
              fontWeight: 800, 
              fontSize: '18px', 
              color: '#1313BA', 
              letterSpacing: '-0.03em' 
            }}>
              Future Chief of Staff (CoS)
            </span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" className="nav-link" style={{
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#6363C6',
              transition: 'color 0.15s ease'
            }}>
              Dashboard
            </Link>
            <Link href="/chat" className="nav-link" style={{
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#6363C6',
              transition: 'color 0.15s ease'
            }}>
              Workspace Chat
            </Link>

            {/* CTA Button */}
            <Link href={username ? "/dashboard" : "/chat"} style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#1313BA',
              border: 'none',
              borderRadius: '0px', // Square corners per radius.md
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0E0E8C'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1313BA'}
            >
              {username ? 'Buka Dashboard' : 'Mulai Sekarang'}
            </Link>
          </nav>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section style={{ 
        backgroundColor: '#1313BA', 
        padding: '100px 24px 80px 24px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', zIndex: 10 }}>
          <h1 style={{ 
            fontSize: '72px', 
            fontWeight: 800, 
            color: '#FFFFFF', 
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: '36px'
          }}>
            Sistem Manajemen Proyek Berbasis AI untuk Masa Depan.
          </h1>
          <p style={{ 
            fontSize: '20px', 
            fontWeight: 400, 
            color: '#CACAF0', 
            lineHeight: 1.5, 
            maxWidth: '768px',
            margin: '36px auto',
            letterSpacing: '-0.01em'
          }}>
            Hubungkan kecerdasan buatan Gemini langsung ke dalam ruang kerja Anda. Pecah tugas kompleks secara otomatis, visualisasikan beban kemajuan, dan sinkronisasikan memo/catatan proyek secara real-time.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '64px' }}>
            <Link href={username ? "/dashboard" : "/chat"} style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#1313BA',
              backgroundColor: '#FFFFFF',
              border: 'none',
              borderRadius: '0px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8F8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              {username ? 'Masuk ke Dashboard ➡️' : 'Coba Gratis Sekarang ➡️'}
            </Link>
          </div>
        </div>

        {/* --- LIVE INTERACTIVE WORKSPACE MOCKUP (Spaced 52px per rule) --- */}
        <div style={{ 
          marginTop: '52px', 
          width: '100%', 
          maxWidth: '1080px', 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E8E8F8', 
          borderRadius: '0px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          height: '520px',
          overflow: 'hidden'
        }}>
          {/* Mock Window Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 20px', 
            borderBottom: '1px solid #E8E8F8', 
            backgroundColor: '#F4F4FC' 
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#FF5F56', borderRadius: '50%' }}></span>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#FFBD2E', borderRadius: '50%' }}></span>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#27C93F', borderRadius: '50%' }}></span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1313BA', letterSpacing: '0.05em' }}>
              📊 WORKSPACE DEMO INTERAKTIF
            </div>
            <div style={{ width: '40px' }}></div>
          </div>

          {/* Split Pane Demo Layout */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            {/* Left Pane: Chat Workspace (60%) */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E8E8F8', backgroundColor: '#FFFFFF', position: 'relative' }}>
              
              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {demoChat.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#9090CE', marginBottom: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                      {msg.role === 'user' ? 'Anda (Demo)' : 'CoS Asisten'}
                    </span>
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: msg.role === 'user' ? '#1313BA' : '#F4F4FC',
                      color: msg.role === 'user' ? '#FFFFFF' : '#6363C6',
                      borderRadius: '0px', // Strict Atlas square corners
                      border: msg.role === 'ai' ? '1px solid #E8E8F8' : 'none',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', padding: '12px 16px', backgroundColor: '#F4F4FC', color: '#9090CE', fontSize: '12px', fontStyle: 'italic' }}>
                    AI sedang mengetik...
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleDemoSend} style={{ padding: '16px', borderTop: '1px solid #E8E8F8', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ketik 'Tambahkan tugas: Rilis versi beta' atau ketik catatan..."
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '13px',
                    border: '1px solid #E8E8F8',
                    borderRadius: '0px',
                    outline: 'none',
                    color: '#6363C6'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1313BA'}
                  onBlur={(e) => e.target.style.borderColor = '#E8E8F8'}
                />
                <button type="submit" style={{
                  backgroundColor: '#1313BA',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Kirim
                </button>
              </form>
            </div>

            {/* Middle Pane: Task Checklist (25%) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E8E8F8', backgroundColor: '#FFFFFF', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1313BA', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Daftar Tugas
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                {demoTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid #E8E8F8',
                    borderRadius: '0px',
                    backgroundColor: task.status === 'completed' ? '#F4F4FC' : '#FFFFFF',
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
                        fontSize: '12px',
                        fontWeight: 600,
                        color: task.status === 'completed' ? '#9090CE' : '#6363C6',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', backgroundColor: task.priority === 'High' ? '#ffebeb' : '#fff9e6', color: task.priority === 'High' ? '#ff3b30' : '#ff9500' }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: '9px', color: '#9090CE' }}>
                          📅 {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane: Project Notes (20%) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1313BA', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Catatan Wiki
              </h4>
              <textarea
                value={demoNotes}
                onChange={(e) => setDemoNotes(e.target.value)}
                style={{
                  flex: 1,
                  width: '100%',
                  padding: '12px',
                  fontSize: '12px',
                  color: '#6363C6',
                  lineHeight: '1.5',
                  border: '1px solid #E8E8F8',
                  borderRadius: '0px',
                  resize: 'none',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '9px', color: '#9090CE', marginTop: '8px', display: 'block' }}>
                💾 Auto-save aktif
              </span>
            </div>

          </div>
        </div>

      </section>

      {/* --- FEATURE SECTION --- */}
      <section style={{ 
        padding: '100px 24px', 
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ maxWidth: '768px', marginBottom: '64px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: '#1313BA', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              display: 'block',
              marginBottom: '12px'
            }}>
              Fitur Utama
            </span>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 800, 
              color: '#1313BA', 
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Alur Kerja Manajemen Modern yang Efisien & Cerdas.
            </h2>
          </div>

          {/* Cards Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px' 
          }}>
            {/* Card 1 */}
            <div className="features-card" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E8F8',
              borderRadius: '0px',
              padding: '32px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: 'rgba(19, 19, 186, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px' 
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1313BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1313BA', marginBottom: '12px' }}>Pencegahan Keterlambatan</h3>
              <p style={{ fontSize: '14px', color: '#6363C6', lineHeight: 1.6 }}>
                Kalkulasi otomatis status deadline dengan indikator visual dinamis (Merah/Oranye/Biru) untuk mengamankan ketepatan waktu pengerjaan.
              </p>
            </div>

            {/* Card 2 */}
            <div className="features-card" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E8F8',
              borderRadius: '0px',
              padding: '32px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: 'rgba(19, 19, 186, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px' 
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1313BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1313BA', marginBottom: '12px' }}>Asisten Pendamping AI</h3>
              <p style={{ fontSize: '14px', color: '#6363C6', lineHeight: 1.6 }}>
                Pecah tugas kompleks menjadi checklist subtugas, ganti proyek, atau perbarui catatan proyek secara langsung dari input percakapan asisten.
              </p>
            </div>

            {/* Card 3 */}
            <div className="features-card" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E8F8',
              borderRadius: '0px',
              padding: '32px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: 'rgba(19, 19, 186, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px' 
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1313BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1313BA', marginBottom: '12px' }}>Workspace Terintegrasi</h3>
              <p style={{ fontSize: '14px', color: '#6363C6', lineHeight: 1.6 }}>
                Split-pane workspace yang menyandingkan daftar tugas dengan catatan dokumentasi wiki secara berdampingan tanpa beralih tab.
              </p>
            </div>

            {/* Card 4 */}
            <div className="features-card" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E8F8',
              borderRadius: '0px',
              padding: '32px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: 'rgba(19, 19, 186, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px' 
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1313BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                  <path d="M7.5 7.5l9 9" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1313BA', marginBottom: '12px' }}>Generative UI (GenUI)</h3>
              <p style={{ fontSize: '14px', color: '#6363C6', lineHeight: 1.6 }}>
                AI asisten secara dinamis merender kartu interaktif (seperti daftar tugas, pengalih proyek, dan wiki) langsung di dalam gelembung obrolan Anda.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- GENERATIVE UI SHOWCASE SECTION --- */}
      <section style={{ 
        padding: '100px 24px', 
        backgroundColor: '#F4F4FC', // Light brand tint background
        borderTop: '1px solid #E8E8F8',
        borderBottom: '1px solid #E8E8F8'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
          
          {/* Visual Showcase (Interactive Mockup card showing text transforming to UI component) */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E8F8',
              padding: '24px',
              borderRadius: '0px',
              boxShadow: '0 8px 24px rgba(19, 19, 186, 0.05)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#9090CE' }}>Input Percakapan</span>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#6363C6', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                "Tolong buatkan ringkasan status tugas proyek kita sekarang."
              </p>
            </div>

            {/* Simulated GenUI Card Output */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #1313BA',
              padding: '24px',
              borderRadius: '0px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Pulsing Badge */}
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '9px',
                fontWeight: 700,
                color: '#FFFFFF',
                backgroundColor: '#1313BA',
                padding: '2px 8px',
                borderRadius: '0px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                ✨ RENDERED BY GENUI
              </span>

              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1313BA', margin: '0 0 12px 0' }}>
                📋 Ringkasan Status Proyek
              </h4>

              {/* Task list simulation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6363C6' }}>
                  <span style={{ color: '#15A34A', fontWeight: 'bold' }}>✓</span>
                  <span style={{ textDecoration: 'line-through' }}>Setup repositori & routing Next.js</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'stretch', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6363C6' }}>
                  <span style={{ color: '#F97316', fontWeight: 'bold' }}>⏳</span>
                  <span>Integrasi visualisasi Gantt Chart</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text block explanation */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1313BA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kelebihan Eksklusif</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1313BA', marginTop: '12px', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              Generative UI: Antarmuka yang Terlahir dari Obrolan.
            </h2>
            <p style={{ fontSize: '16px', color: '#6363C6', lineHeight: 1.6, marginBottom: '24px' }}>
              Tidak seperti asisten AI tradisional yang hanya membalas dengan teks markdown kaku, asisten AI Future CoS dapat menghasilkan komponen antarmuka yang hidup, interaktif, dan fungsional secara instan di dalam chat bubble Anda.
            </p>
            <ul style={{ paddingLeft: '20px', color: '#6363C6', fontSize: '14px', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Interaksi Langsung</strong>: Klik, centang, atau jalankan perintah langsung di dalam kartu obrolan tanpa beralih halaman.</li>
              <li><strong>Representasi Data Visual</strong>: Rendering grafik persentase kemajuan pengerjaan yang dibuat khusus secara real-time.</li>
              <li><strong>Integrasi Penuh</strong>: Data dari komponen GenUI tersinkronisasi otomatis dengan database global proyek Anda.</li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- INTERACTIVE SVG METRICS SECTION --- */}
      <section style={{ 
        padding: '100px 24px', 
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E8E8F8'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
          
          {/* Text block */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1313BA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statistik Riil</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1313BA', marginTop: '12px', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              Analisis Kemajuan Real-Time & Skalabilitas Kerja
            </h2>
            <p style={{ fontSize: '16px', color: '#6363C6', lineHeight: 1.6, marginBottom: '32px' }}>
              Sistem visualisasi kami memetakan prioritas pengerjaan tugas secara dinamis. Anda selalu tahu tugas mana yang menghambat kemajuan proyek.
            </p>

            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA' }}>98%</div>
                <div style={{ fontSize: '12px', color: '#9090CE', fontWeight: 600, marginTop: '4px' }}>Tingkat Penyelesaian</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#1313BA' }}>&lt; 2 Detik</div>
                <div style={{ fontSize: '12px', color: '#9090CE', fontWeight: 600, marginTop: '4px' }}>Respon AI Asisten</div>
              </div>
            </div>
          </div>

          {/* SVG Animated chart mockup (Spaced 52px per rule) */}
          <div style={{ flex: 1, minWidth: '300px', border: '1px solid #E8E8F8', padding: '32px', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1313BA', marginBottom: '20px' }}>📊 Distribusi Tugas Aktif</h3>
            
            {/* Live Chart bars simulating task distribution */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#ff3b30', fontWeight: 700 }}>🔥 Prioritas Tinggi</span>
                  <span style={{ color: '#6363C6', fontWeight: 600 }}>12 Tugas</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E8E8F8', borderRadius: '0px' }}>
                  <div style={{ width: '80%', height: '100%', backgroundColor: '#ff3b30', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#ff9500', fontWeight: 700 }}>⚡ Prioritas Sedang</span>
                  <span style={{ color: '#6363C6', fontWeight: 600 }}>18 Tugas</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E8E8F8', borderRadius: '0px' }}>
                  <div style={{ width: '60%', height: '100%', backgroundColor: '#ff9500', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#1313BA', fontWeight: 700 }}>🟢 Prioritas Rendah</span>
                  <span style={{ color: '#6363C6', fontWeight: 600 }}>8 Tugas</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E8E8F8', borderRadius: '0px' }}>
                  <div style={{ width: '40%', height: '100%', backgroundColor: '#1313BA', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FAQ ACCORDION SECTION (Grouped Variant per accordion.md specs) --- */}
      <section style={{ 
        padding: '100px 24px', 
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E8E8F8'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ maxWidth: '768px', marginBottom: '64px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1313BA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FAQ</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1313BA', marginTop: '12px', letterSpacing: '-0.02em' }}>Pertanyaan Sering Diajukan</h2>
          </div>

          {/* Accordion Grouped Container (Radius 0px, No Perimeter border, Dividers between) */}
          <div style={{ 
            maxWidth: '768px', 
            border: 'none', 
            borderRadius: '0px', 
            overflow: 'hidden',
            backgroundColor: '#FFFFFF'
          }}>
            {[
              {
                q: "Bagaimana cara asisten AI membantu memecah tugas?",
                a: "Saat Anda mengetik instruksi natural (misal: 'Beri saya tugas riset kompetitor'), AI akan menganalisis kompleksitas tugas tersebut. Jika tugas dinilai besar, AI secara otomatis akan membuat daftar subtugas checklist bertingkat untuk pengerjaan yang terstruktur."
              },
              {
                q: "Di mana database data proyek saya disimpan?",
                a: "Data proyek dan catatan Anda disimpan secara lokal per-pengguna langsung di backend server atau memori local storage peramban Anda. Hal ini memastikan data Anda tetap private dan terisolasi dengan aman."
              },
              {
                q: "Apakah saya bisa mengubah tanggal tenggat waktu secara langsung?",
                a: "Ya! Badge tenggat waktu di daftar tugas kami didesain sebagai pemilih tanggal interaktif. Cukup klik badge status deadline pada tugas mana pun untuk mengubah tenggat waktunya secara langsung."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} style={{ 
                  borderBottom: idx !== 2 ? '1px solid #E8E8F8' : 'none',
                  backgroundColor: isOpen ? '#F4F4FC' : 'transparent',
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
                      padding: '20px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      outline: 'none'
                    }}
                  >
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: isOpen ? '#1313BA' : '#6363C6',
                      transition: 'color 0.15s ease'
                    }}>
                      {faq.q}
                    </span>
                    {/* Chevron Indicator (rotating 180deg) */}
                    <svg 
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpen ? '#1313BA' : '#9090CE'}
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
                    maxHeight: isOpen ? '200px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <div style={{ padding: '0 20px 20px 20px', fontSize: '14px', color: '#6363C6', lineHeight: 1.5 }}>
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
        backgroundColor: '#1313BA', 
        color: '#FFFFFF', 
        padding: '64px 24px'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '24px' 
        }}>
          <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em' }}>Future Chief of Staff (CoS)</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/dashboard" className="footer-link" style={{ textDecoration: 'none', color: '#CACAF0', fontSize: '13px' }}>Dashboard</Link>
            <Link href="/chat" className="footer-link" style={{ textDecoration: 'none', color: '#CACAF0', fontSize: '13px' }}>Workspace</Link>
          </div>
          <p style={{ fontSize: '12px', color: '#CACAF0', marginTop: '12px' }}>
            &copy; 2026 Future Chief of Staff (CoS). Built with TypeUI Atlas Design System.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .nav-link:hover {
          color: #1313BA !important;
        }
        footer .footer-link:hover {
          color: #FFFFFF !important;
          opacity: 0.8;
        }
        .features-card:hover {
          border-color: #1313BA !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
