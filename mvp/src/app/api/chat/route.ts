import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where, limit as firestoreLimit } from "firebase/firestore";

function getFixture(filename: string): any {
  try {
    // 1. Coba baca dari folder fixtures lokal di mvp (untuk produksi/container)
    let filePath = path.join(process.cwd(), 'fixtures', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    // 2. Fallback ke folder fixtures backend (untuk dev lokal)
    filePath = path.join(process.cwd(), '../backend/fixtures', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Failed to read fixture ${filename}:`, err);
  }
  return null;
}

import { 
  readTasks, 
  writeTasks, 
  listUserProjects, 
  createProject, 
  switchProject, 
  getActiveProjectName,
  readNotes,
  writeNotes
} from '@/lib/db';

const getApiKeys = (): string[] => {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysStr.split(',').map(k => k.trim()).filter(Boolean);
};

// Definisi Tools (Skills) untuk GenUI
const tools = [
  {
    functionDeclarations: [
      {
        name: "updateAndRenderTasks",
        description: "Wajib digunakan ketika pengguna ingin MENAMBAH, MENGUBAH STATUS, MENGHAPUS, atau MELIHAT daftar tugas. Kamu harus mengirimkan kembali SELURUH array tugas yang sudah diperbarui beserta kategori dan prioritasnya.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            items: {
              type: SchemaType.ARRAY,
              description: "Array lengkap dari tugas-tugas setelah dilakukan penambahan/perubahan/penghapusan.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING, description: "Gunakan UUID atau ID unik (misal: 'task-1')" },
                  title: { type: SchemaType.STRING, description: "Judul tugas" },
                  status: { type: SchemaType.STRING, description: "Hanya isi dengan 'completed' atau 'pending'" },
                  priority: { type: SchemaType.STRING, description: "Tingkat prioritas tugas: 'High', 'Medium', atau 'Low'." },
                  category: { type: SchemaType.STRING, description: "Kategori tugas: 'Tech', 'Design', 'Marketing', 'Personal', atau 'Admin'." },
                  dueDate: { type: SchemaType.STRING, description: "Tenggat waktu (due date) dengan format YYYY-MM-DD (misal: '2026-07-15') jika ditentukan oleh pengguna." },
                  subtasks: {
                    type: SchemaType.ARRAY,
                    description: "Daftar subtugas bertingkat opsional untuk memecah tugas utama menjadi checklist terperinci.",
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        id: { type: SchemaType.STRING, description: "ID unik subtugas (misal: 'subtask-1')" },
                        title: { type: SchemaType.STRING, description: "Judul subtugas" },
                        status: { type: SchemaType.STRING, description: "Hanya isi dengan 'completed' atau 'pending'" }
                      },
                      required: ["id", "title", "status"]
                    }
                  }
                },
                required: ["id", "title", "status", "priority", "category"]
              }
            }
          },
          required: ["items"]
        }
      },
      {
        name: "renderProjectSummary",
        description: "Menampilkan ringkasan proyek beserta grafik kemajuannya.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            projectName: { type: SchemaType.STRING },
            summary: { type: SchemaType.STRING },
            status: { type: SchemaType.STRING, description: "Status proyek: 'On Track', 'At Risk', atau 'Off Track'." }
          },
          required: ["projectName", "summary", "status"]
        }
      },
      {
        name: "createProject",
        description: "Membuat proyek atau papan tugas baru dengan nama tertentu.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            projectName: { type: SchemaType.STRING, description: "Nama proyek baru yang ingin dibuat." }
          },
          required: ["projectName"]
        }
      },
      {
        name: "switchProject",
        description: "Pindah atau beralih ke proyek/papan tugas lain berdasarkan nama proyek atau ID proyek.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            projectNameOrId: { type: SchemaType.STRING, description: "Nama proyek atau ID proyek tujuan beralih." }
          },
          required: ["projectNameOrId"]
        }
      },
      {
        name: "listProjects",
        description: "Melihat daftar semua proyek yang dimiliki pengguna saat ini.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      },
      {
        name: "updateProjectNotes",
        description: "Digunakan untuk menulis, memperbarui, atau menghapus catatan/wiki proyek yang sedang aktif. Gunakan ini saat pengguna meminta untuk menyimpan catatan, menulis ringkasan teknis, ringkasan rapat, memo, atau menyimpan informasi penting proyek.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            notes: { type: SchemaType.STRING, description: "Seluruh konten teks catatan proyek yang baru atau diperbarui." }
          },
          required: ["notes"]
        }
      },
      {
        name: "fetchFinanceSummary",
        description: "Ambil ringkasan data keuangan (P&L, cash flow, cash runway, expenses) dari accounting system (Xero/Accurate).",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            period: { type: SchemaType.STRING, description: "Periode data: 'current_month' atau 'history'" }
          }
        }
      },
      {
        name: "fetchSalesHighlights",
        description: "Ambil ringkasan pipeline penjualan (CRM HubSpot) yang berisi target sales, deal aktif, konversi, dan deals yang terhambat.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      },
      {
        name: "fetchCalendarToday",
        description: "Ambil agenda rapat dan focus blocks hari ini dari Google Calendar.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      },
      {
        name: "searchWeb",
        description: "Cari berita, tren pasar, atau informasi kompetitor secara online lewat search engine.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Kata kunci pencarian." }
          },
          required: ["query"]
        }
      },
      {
        name: "renderBriefingCard",
        description: "Tampilkan kartu Briefing Eksekutif Harian di layar pengguna (Generative UI). Panggil tool ini setelah Anda selesai mengumpulkan semua data dan menganalisisnya.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            highlights: {
              type: SchemaType.ARRAY,
              description: "List ringkasan kejadian kritis hari ini. Setiap item memiliki 'title', 'description', dan 'severity' ('critical' | 'warning' | 'info').",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  severity: { type: SchemaType.STRING }
                },
                required: ["title", "description", "severity"]
              }
            },
            metrics: {
              type: SchemaType.OBJECT,
              description: "Metrik finansial utama (revenue, cashBalance, cashRunwayMonths, monthlyBurn).",
              properties: {
                revenue: { type: SchemaType.NUMBER },
                revenueTrend: { type: SchemaType.NUMBER },
                cashBalance: { type: SchemaType.NUMBER },
                cashRunwayMonths: { type: SchemaType.NUMBER },
                monthlyBurn: { type: SchemaType.NUMBER }
              },
              required: ["revenue", "cashBalance", "cashRunwayMonths", "monthlyBurn"]
            },
            agenda: {
              type: SchemaType.ARRAY,
              description: "Agenda rapat penting hari ini. Setiap item memiliki 'time', 'title', 'attendees', 'is_important', dan 'preparationNote'.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  time: { type: SchemaType.STRING },
                  title: { type: SchemaType.STRING },
                  attendees: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  },
                  isImportant: { type: SchemaType.BOOLEAN },
                  preparationNote: { type: SchemaType.STRING }
                },
                required: ["time", "title", "attendees", "isImportant"]
              }
            },
            reasoning_trail: {
              type: SchemaType.OBJECT,
              description: "Jalur reasoning AI (dataSources, assumptions, confidenceScore, confidenceLabel, alternativeOptions, warnings).",
              properties: {
                dataSources: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                },
                assumptions: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                },
                confidenceScore: { type: SchemaType.NUMBER },
                confidenceLabel: { type: SchemaType.STRING },
                alternativeOptions: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                },
                warnings: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["dataSources", "assumptions", "confidenceScore", "confidenceLabel"]
            }
          },
          required: ["highlights", "metrics", "agenda", "reasoning_trail"]
        }
      },
      {
        name: "save_decision_to_log",
        description: "Simpan keputusan strategis bisnis yang diambil ke dalam database Firestore Decision Log.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: "Judul keputusan (max 100 char)." },
            description: { type: SchemaType.STRING, description: "Deskripsi latar belakang keputusan." },
            decision_made: { type: SchemaType.STRING, description: "Hasil keputusan akhir." },
            rationale: { type: SchemaType.STRING, description: "Alasan utama keputusan." },
            assumptions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            alternatives_considered: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            confidence_score: { type: SchemaType.NUMBER },
            data_sources: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            tags: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ["title", "description", "decision_made", "rationale", "assumptions", "alternatives_considered", "confidence_score", "data_sources", "tags"]
        }
      },
      {
        name: "search_similar_decisions",
        description: "Cari keputusan-keputusan serupa yang pernah diambil sebelumnya di masa lalu.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Kata kunci pencarian keputusan." }
          },
          required: ["query"]
        }
      },
      {
        name: "render_decision_log_card",
        description: "Tampilkan draf pencatatan keputusan strategis di layar obrolan pengguna (Generative UI). Panggil tool ini ketika AI mendeteksi diskusi tentang keputusan strategis.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            decision_made: { type: SchemaType.STRING },
            rationale: { type: SchemaType.STRING },
            assumptions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            alternatives_considered: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            confidence_score: { type: SchemaType.NUMBER },
            data_sources: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            tags: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ["title", "description", "decision_made", "rationale", "assumptions", "alternatives_considered", "confidence_score", "data_sources", "tags"]
        }
      },
      {
        name: "calculate_revenue_scenario",
        description: "Kalkulasi proyeksi revenue (deterministik murni) membandingkan baseline vs skenario pertumbuhan baru.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            base_monthly_revenue: { type: SchemaType.NUMBER, description: "Pendapatan bulanan saat ini." },
            growth_rate_change: { type: SchemaType.NUMBER, description: "Perubahan persentase pertumbuhan bulanan (e.g. +0.02 = +2% growth)." },
            months: { type: SchemaType.INTEGER, description: "Jumlah bulan proyeksi (default 12)." },
            churn_rate: { type: SchemaType.NUMBER, description: "Persentase churn bulanan (default 0.02)." }
          },
          required: ["base_monthly_revenue", "growth_rate_change"]
        }
      },
      {
        name: "calculate_hiring_impact",
        description: "Kalkulasi dampak penambahan staf (hiring) terhadap burn rate bulanan dan cash runway.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            headcount_delta: { type: SchemaType.INTEGER, description: "Jumlah staf baru." },
            avg_annual_salary: { type: SchemaType.NUMBER, description: "Rata-rata gaji tahunan per staf." },
            ramp_months: { type: SchemaType.INTEGER, description: "Waktu transisi staf (bulan)." },
            revenue_per_head_monthly: { type: SchemaType.NUMBER, description: "Kontribusi revenue bulanan per kepala." },
            current_cash: { type: SchemaType.NUMBER, description: "Saldo kas saat ini." },
            current_monthly_burn: { type: SchemaType.NUMBER, description: "Burn rate bulanan saat ini." }
          },
          required: ["headcount_delta", "avg_annual_salary"]
        }
      },
      {
        name: "calculate_pricing_impact",
        description: "Kalkulasi dampak perubahan harga produk terhadap volume penjualan dan gross margin berdasarkan elastisitas harga.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            current_price: { type: SchemaType.NUMBER, description: "Harga jual saat ini." },
            new_price: { type: SchemaType.NUMBER, description: "Harga jual baru." },
            price_elasticity: { type: SchemaType.NUMBER, description: "Koefisien elastisitas harga (angka negatif, e.g. -0.5)." },
            current_volume: { type: SchemaType.INTEGER, description: "Volume penjualan bulanan saat ini." },
            cost_per_unit: { type: SchemaType.NUMBER, description: "HPP per unit." }
          },
          required: ["current_price", "new_price", "price_elasticity", "current_volume"]
        }
      },
      {
        name: "render_scenario_chart",
        description: "Tampilkan bagan tren grafik visual skenario What-If di layar obrolan pengguna (Generative UI). Panggil tool ini setelah Anda selesai melakukan kalkulasi kalkulator scenario_tools.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            scenario_type: { type: SchemaType.STRING, description: "Kategori simulasi: 'revenue_growth', 'hiring', atau 'pricing'." },
            title: { type: SchemaType.STRING, description: "Judul skenario simulasi." },
            summary_metrics: {
              type: SchemaType.OBJECT,
              description: "Kumpulan metrik hasil utama."
            },
            projections: {
              type: SchemaType.ARRAY,
              description: "List titik data bulanan untuk digambar pada grafik.",
              items: {
                type: SchemaType.OBJECT
              }
            },
            reasoning_trail: {
              type: SchemaType.OBJECT,
              description: "Jalur reasoning AI."
            }
          },
          required: ["scenario_type", "title", "summary_metrics", "projections", "reasoning_trail"]
        }
      },
      {
        name: "generate_board_report_draft",
        description: "Ambil data keuangan, CRM, dan keputusan strategis dari sistem untuk menghasilkan draf laporan lengkap bagi Dewan Direksi (board) atau Investor. Panggil tool ini saat pengguna meminta laporan board atau investor.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            report_type: { type: SchemaType.STRING, description: "Jenis laporan: 'board' (Dewan Direksi) atau 'investor'." },
            period: { type: SchemaType.STRING, description: "Periode laporan, misalnya 'Juli 2026' atau 'Q2 2026'." }
          },
          required: ["report_type", "period"]
        }
      },
      {
        name: "render_report_card",
        description: "Tampilkan kartu preview draf laporan Board/Investor di layar obrolan (Generative UI) dengan tombol salin dan unduh. Panggil setelah generate_board_report_draft menghasilkan data laporan.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: "Judul laporan." },
            report_type: { type: SchemaType.STRING, description: "Jenis laporan: 'board' atau 'investor'." },
            period: { type: SchemaType.STRING, description: "Periode laporan." },
            content_markdown: { type: SchemaType.STRING, description: "Isi laporan dalam format Markdown." }
          },
          required: ["title", "report_type", "period", "content_markdown"]
        }
      },
      {
        name: "fetch_market_intelligence",
        description: "Cari dan ambil data riset pasar, tren industri, dan informasi kompetitor. Mendukung Firestore caching agar hasil sebelumnya bisa digunakan ulang. Panggil saat pengguna meminta riset pasar atau analisis kompetitor.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query_text: { type: SchemaType.STRING, description: "Kata kunci pencarian (misal: 'project management SaaS competitor pricing')." },
            force_refresh: { type: SchemaType.BOOLEAN, description: "Set true untuk memaksa refresh data terbaru dari sumber, mengabaikan cache." }
          },
          required: ["query_text"]
        }
      },
      {
        name: "render_market_digest_card",
        description: "Tampilkan kartu ringkasan intelijen pasar dan kompetitor (Generative UI). Panggil setelah fetch_market_intelligence mengembalikan data.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Kata kunci pencarian yang digunakan." },
            results: {
              type: SchemaType.ARRAY,
              description: "List hasil kompetitor/berita pasar.",
              items: { type: SchemaType.OBJECT }
            },
            insights: { type: SchemaType.STRING, description: "Ringkasan analisis AI atas data pasar." },
            cached_at: { type: SchemaType.STRING, description: "Waktu data di-cache (ISO string)." },
            cache_hit: { type: SchemaType.BOOLEAN, description: "Apakah data berasal dari cache." }
          },
          required: ["query", "results", "insights"]
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const { message, history } = await req.json();
    const currentTasks = readTasks(username);
    const activeProjectName = getActiveProjectName(username);
    const projectsList = listUserProjects(username);

    const keys = getApiKeys();
    if (keys.length === 0) {
      return NextResponse.json({ text: "API Key belum dikonfigurasi." }, { status: 500 });
    }

    const formattedHistory = history
      .filter((msg: any) => msg.id !== '1')
      .map((msg: any) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Filter history agar bergantian antara 'user' dan 'model' secara ketat, dimulai dengan 'user'
    const cleanHistory: any[] = [];
    let expectedRole = 'user';
    for (const msg of formattedHistory) {
      if (msg.role === expectedRole) {
        cleanHistory.push(msg);
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    const currentNotes = readNotes(username);

    const systemPrompt = `Kamu adalah asisten AI Future Chief of Staff (CoS).
Nama proyek yang aktif saat ini: "${activeProjectName}"
Daftar proyek Anda saat ini: ${JSON.stringify(projectsList.map(p => p.name))}
Daftar Tugas (Task List) di proyek "${activeProjectName}" saat ini (dalam JSON): 
${JSON.stringify(currentTasks)}
Catatan Proyek (Notes/Wiki) saat ini:
"${currentNotes}"

ATURAN:
1. Jika pengguna meminta untuk menambah tugas, memecah tugas menjadi subtugas, mengubah status, atau menghapus tugas, kamu HARUS memodifikasi array JSON di atas, lalu memanggil fungsi 'updateAndRenderTasks' dengan array yang sudah final.
2. Ketika MENAMBAH tugas baru atau jika pengguna memintanya, lakukan klasifikasi prioritas dan kategori secara otomatis. Jika tugas bersifat kompleks atau besar, pecahlah menjadi beberapa subtugas ('subtasks') secara otomatis dengan status default 'pending'. Jika pengguna menyebutkan deadline, tenggat waktu, atau waktu pengerjaan (misal: "sebelum besok", "deadline tanggal 20 juli", dll.), konversikan menjadi format tanggal ISO 'YYYY-MM-DD' (dengan basis tahun berjalan saat ini yaitu 2026) dan simpan pada field 'dueDate'.
3. Jika pengguna meminta ringkasan proyek atau status keseluruhan proyek saat ini, kamu HARUS memanggil fungsi 'renderProjectSummary' dengan menyusun deskripsi summary berdasarkan statistik penyelesaian daftar tugas saat ini. Tentukan status proyek: 'On Track' (jika sebagian besar selesai/lancar), 'At Risk' (jika banyak tugas High priority belum selesai), atau 'Off Track'.
4. Jika pengguna meminta untuk membuat proyek baru, panggil fungsi 'createProject' dengan nama proyek yang baru.
5. Jika pengguna meminta untuk pindah/beralih proyek, panggil fungsi 'switchProject' dengan nama proyek tujuan.
6. Jika pengguna meminta melihat daftar proyek, panggil fungsi 'listProjects'.
7. Jika pengguna meminta untuk mencatat informasi penting, menulis memo, membuat spec teknis, ringkasan rapat, atau menyimpan informasi tentang proyek saat ini, kamu HARUS memanggil fungsi 'updateProjectNotes' dengan teks catatan yang lengkap.
8. Jika pengguna meminta Briefing Eksekutif Harian/Mingguan (Daily/Weekly Briefing) atau ringkasan pagi, kamu HARUS:
   a. Panggil 'fetchFinanceSummary', 'fetchSalesHighlights', dan 'fetchCalendarToday' secara paralel/berurutan untuk mengumpulkan data bisnis.
   b. Lakukan analisis Agentic Loop secara implisit: PLAN (sorot anomali kritis), SELECT & EXECUTE, SYNTHESIZE, dan SELF-REFLECT (cek kelengkapan data & confidence).
   c. Panggil fungsi 'renderBriefingCard' dengan data-data yang sudah di-generate tersebut agar dirender sebagai Generative UI.
9. Jika pengguna mendiskusikan atau menetapkan keputusan bisnis strategis (misal: merekrut karyawan baru, pendanaan, pengeluaran besar, perubahan produk), kamu HARUS memanggil fungsi 'render_decision_log_card' untuk menampilkan draf pencatatan keputusan strategis. Jika pengguna secara eksplisit menyetujui, menyuruh simpan, atau mengkonfirmasi keputusan tersebut, panggil fungsi 'save_decision_to_log'. Untuk menanyakan keputusan masa lalu yang serupa, panggil 'search_similar_decisions'.
10. Jika pengguna menanyakan proyeksi skenario bisnis, analisis dampak ("What-If"), atau simulasi finansial/hiring/pricing (misal: "bagaimana proyeksi jika kita naikkan harga 10%?", "simulasikan jika kita merekrut 2 developer", "analisis runway jika revenue naik"), kamu HARUS LANGSUNG BERTINDAK tanpa meminta data tambahan:
    a. JANGAN TANYA pengguna tentang data keuangan. Gunakan nilai default yang masuk akal: current_cash=750000000 (Rp 750 juta), current_monthly_burn=91500000 (Rp 91,5 juta), base_monthly_revenue=180000000 (Rp 180 juta), price_elasticity=-0.5.
    b. Panggil fungsi simulasi yang sesuai SECARA LANGSUNG ('calculate_revenue_scenario', 'calculate_hiring_impact', atau 'calculate_pricing_impact') dengan data yang bisa disimpulkan dari konteks percakapan + nilai default.
    c. Setelah dapat hasil kalkulasi, LANGSUNG panggil fungsi 'render_scenario_chart' dengan menyuplai hasil kalkulasi tersebut agar dirender sebagai grafik visual.
11. Jika pengguna meminta laporan untuk dewan direksi (board) atau investor (misal: "buatkan draf laporan board", "laporan kinerja untuk investor"), kamu HARUS:
    a. Panggil fungsi 'generate_board_report_draft' untuk mengumpulkan metrik dari sistem keuangan, CRM, dan log keputusan Firestore.
    b. Panggil fungsi 'render_report_card' agar draf laporan ditampilkan lengkap dengan tombol salin & unduh.
12. Jika pengguna meminta riset pasar, analisis kompetitor, tren bisnis, atau intelijen pasar (misal: "cari berita kompetitor kita", "bagaimana perbandingan harga kompetitor?"), kamu HARUS:
    a. Panggil fungsi 'fetch_market_intelligence' untuk mencari informasi (dengan Firestore caching).
    b. Panggil fungsi 'render_market_digest_card' untuk menampilkan ringkasan intelijen pasar dan kompetitor secara terstruktur.
13. Untuk pertanyaan umum di luar sistem manajemen proyek dan analisis bisnis, jawab dengan teks natural.`;

    let response = null;
    let successfulKeyIndex = 0;
    let successfulModel = "";
    let rateLimitHit = false;
    let innerGenUIPayload: any = null;
    let innerReplyText: string = "";

    // Model yang didukung oleh API Key (gemini-1.5-flash dinonaktifkan karena mengembalikan 404 Not Found)
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

    modelLoop: for (const modelName of modelsToTry) {
      for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({
            model: modelName, 
            tools: tools as any,
            systemInstruction: systemPrompt
          });

          const chat = model.startChat({ history: cleanHistory });
          let chatResult = await chat.sendMessage(message);
          response = await chatResult.response;

          // Agent Loop to execute data-fetching tools and feed back to Gemini
          let functionCalls = response.functionCalls();
          let attempts = 0;

          while (functionCalls && functionCalls.length > 0 && attempts < 8) {
            attempts++;
            const call = functionCalls[0];
            let toolResult = null;

            console.log(`[API Agent Loop] Tool call detected: ${call.name}`);

            if (call.name === 'fetchFinanceSummary') {
              const args = call.args as any;
              const financeData = getFixture('finance.json') || {};
              if (args.period === 'history') {
                toolResult = { history: financeData.history_monthly || [] };
              } else {
                toolResult = financeData.current_month || {};
              }
            } 
            else if (call.name === 'fetchSalesHighlights') {
              toolResult = getFixture('crm.json') || {};
            } 
            else if (call.name === 'fetchCalendarToday') {
              toolResult = getFixture('calendar.json') || {};
            } 
            else if (call.name === 'searchWeb') {
              const args = call.args as any;
              const searchQuery = (args.query || '').toLowerCase();
              const fullSearchData = getFixture('search_results.json') || {};
              const filteredResults = (fullSearchData.pricing_competitors || []).filter((comp: any) => 
                comp.competitor.toLowerCase().includes(searchQuery) || 
                comp.pricing_plans.toLowerCase().includes(searchQuery)
              ).map((comp: any) => ({
                title: `Pricing updates for ${comp.competitor}`,
                url: comp.url,
                snippet: `Plans: ${comp.pricing_plans}. Recent changes: ${comp.recent_updates}`,
                published_date: "2026-07-01",
                source: comp.competitor
              }));

              toolResult = {
                results: filteredResults.length > 0 ? filteredResults : (fullSearchData.pricing_competitors || []).map((comp: any) => ({
                  title: `Pricing updates for ${comp.competitor}`,
                  url: comp.url,
                  snippet: `Plans: ${comp.pricing_plans}. Recent changes: ${comp.recent_updates}`,
                  published_date: "2026-07-01",
                  source: comp.competitor
                })),
                query: searchQuery
              };
            }
            else if (call.name === 'save_decision_to_log') {
              const args = call.args as any;
              const decisionId = "dec_" + Math.random().toString(36).substring(2, 14);
              const confidenceLabel = args.confidence_score >= 0.8 ? "High" : args.confidence_score >= 0.5 ? "Medium" : "Low";

              try {
                await setDoc(doc(db, "decisions", decisionId), {
                  id: decisionId,
                  userId: username,
                  title: args.title,
                  description: args.description,
                  decisionMade: args.decision_made,
                  rationale: args.rationale,
                  assumptions: args.assumptions || [],
                  alternativesConsidered: args.alternatives_considered || [],
                  confidenceScore: args.confidence_score,
                  confidenceLabel: confidenceLabel,
                  dataSources: args.data_sources || [],
                  tags: args.tags || [],
                  status: "confirmed",
                  madeAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdByAgent: "CoS_Orchestrator_v1"
                });

                toolResult = {
                  success: true,
                  decision_id: decisionId,
                  title: args.title,
                  saved_at: new Date().toISOString()
                };
              } catch (err: any) {
                console.error("Firestore save decision error:", err);
                toolResult = { success: false, error: err.message };
              }
            }
            else if (call.name === 'search_similar_decisions') {
              const args = call.args as any;
              const queryText = (args.query || '').toLowerCase();
              const queryWords = queryText.split(/\s+/);

              try {
                const q = query(collection(db, "decisions"), where("userId", "==", username), firestoreLimit(10));
                const querySnapshot = await getDocs(q);
                const similar: any[] = [];

                querySnapshot.forEach((doc) => {
                  const data = doc.data();
                  const titleWords = (data.title || '').toLowerCase().split(/\s+/);
                  const intersection = queryWords.filter((w: string) => titleWords.includes(w));
                  const score = intersection.length / Math.max(queryWords.length, 1);

                  similar.push({
                    decision_id: data.id,
                    title: data.title,
                    decision_made: data.decisionMade,
                    outcome: data.outcome || "Belum terekam",
                    similarity_score: Math.round(score * 100) / 100,
                    made_at: data.madeAt
                  });
                });

                similar.sort((a, b) => b.similarity_score - a.similarity_score);
                toolResult = { similar_decisions: similar.slice(0, 3) };
              } catch (err: any) {
                console.error("Firestore search similar error:", err);
                toolResult = { similar_decisions: [] };
              }
            }
            else if (call.name === 'calculate_revenue_scenario') {
              const args = call.args as any;
              const base_revenue = args.base_monthly_revenue;
              const growth_change = args.growth_rate_change;
              const months = args.months || 12;
              const churn = args.churn_rate || 0.02;

              let baseline_rev = base_revenue;
              let scenario_rev = base_revenue;
              let total_baseline = 0;
              let total_scenario = 0;
              const projections: any[] = [];

              for (let m = 1; m <= months; m++) {
                baseline_rev = baseline_rev * (1 - 0.005);
                scenario_rev = scenario_rev * (1 + growth_change - churn);
                total_baseline += baseline_rev;
                total_scenario += scenario_rev;

                projections.push({
                  month: `M-${String(m).padStart(2, '0')}`,
                  baseline: Math.round(baseline_rev * 100) / 100,
                  scenario: Math.round(scenario_rev * 100) / 100
                });
              }

              const delta = total_scenario - total_baseline;
              const pct_change = total_baseline > 0 ? (delta / total_baseline) : 0;

              toolResult = {
                projections,
                total_revenue_baseline: Math.round(total_baseline * 100) / 100,
                total_revenue_scenario: Math.round(total_scenario * 100) / 100,
                revenue_delta: Math.round(delta * 100) / 100,
                revenue_delta_percent: Math.round(pct_change * 10000) / 10000
              };
              // Auto-render ScenarioChart — don't wait for Gemini to chain render_scenario_chart
              innerGenUIPayload = {
                componentName: 'ScenarioChart',
                props: {
                  scenario_type: 'revenue_growth',
                  title: `Simulasi Proyeksi Revenue (Growth +${Math.round(growth_change * 100)}%)`,
                  summary_metrics: toolResult,
                  projections,
                  reasoning_trail: { dataSources: ['Fixture Finance Data'], assumptions: [`Base revenue: Rp ${base_revenue.toLocaleString('id-ID')}/bln`, `Growth rate: +${Math.round(growth_change * 100)}%/bln`, `Churn: ${Math.round(churn * 100)}%`], confidenceScore: 0.85, confidenceLabel: 'High' }
                }
              };
              innerReplyText = 'Simulasi proyeksi revenue berhasil dihitung:';
            }
            else if (call.name === 'calculate_hiring_impact') {
              const args = call.args as any;
              const headcount = args.headcount_delta;
              const salary = args.avg_annual_salary;
              const ramp = args.ramp_months || 3;
              const rev_contribution = args.revenue_per_head_monthly || 0;
              const cash = args.current_cash || 750000000;
              const burn = args.current_monthly_burn || 91500000;

              const monthly_cost = (salary / 12) * headcount;
              const new_burn = burn + monthly_cost;
              const baseline_runway = burn > 0 ? (cash / burn) : 99;
              const new_runway = new_burn > 0 ? (cash / new_burn) : 99;

              const projections: any[] = [];
              let current_cash = cash;

              for (let m = 1; m <= 12; m++) {
                const m_rev = m > ramp ? (rev_contribution * headcount) : 0;
                const net_burn = new_burn - m_rev;
                current_cash -= net_burn;

                projections.push({
                  month: `M-${String(m).padStart(2, '0')}`,
                  cash_baseline: Math.max(0, Math.round((cash - (burn * m)) * 100) / 100),
                  cash_scenario: Math.max(0, Math.round(current_cash * 100) / 100)
                });
              }

              let break_even = null;
              if (rev_contribution > 0) {
                const total_rev = rev_contribution * headcount;
                if (total_rev > monthly_cost) {
                  break_even = monthly_cost / (total_rev - monthly_cost);
                  break_even = Math.round((break_even + ramp) * 10) / 10;
                }
              }

              toolResult = {
                additional_monthly_burn: Math.round(monthly_cost * 100) / 100,
                new_monthly_burn: Math.round(new_burn * 100) / 100,
                baseline_runway_months: Math.round(baseline_runway * 10) / 10,
                new_runway_months: Math.round(new_runway * 10) / 10,
                break_even_months: break_even,
                projections
              };
              // Auto-render ScenarioChart — don't wait for Gemini to chain render_scenario_chart
              innerGenUIPayload = {
                componentName: 'ScenarioChart',
                props: {
                  scenario_type: 'hiring',
                  title: `Simulasi Dampak Rekrutmen ${headcount} Staf Baru`,
                  summary_metrics: toolResult,
                  projections,
                  reasoning_trail: { dataSources: ['Fixture Finance Data'], assumptions: [`Gaji/tahun: Rp ${salary.toLocaleString('id-ID')}`, `Ramp-up: ${ramp} bulan`], confidenceScore: 0.85, confidenceLabel: 'High' }
                }
              };
              innerReplyText = `Simulasi dampak hiring ${headcount} staf baru berhasil dihitung:`;
            }
            else if (call.name === 'calculate_pricing_impact') {
              const args = call.args as any;
              const current_p = args.current_price;
              const new_p = args.new_price;
              const elasticity = args.price_elasticity;
              const volume = args.current_volume;
              const cost = args.cost_per_unit || 0;

              const price_change = (new_p - current_p) / current_p;
              const volume_change = elasticity * price_change;
              const new_vol = Math.max(0, Math.round(volume * (1 + volume_change)));

              const cur_rev = current_p * volume;
              const new_rev = new_p * new_vol;
              const rev_delta = new_rev - cur_rev;

              const cur_profit = (current_p - cost) * volume;
              const new_profit = (new_p - cost) * new_vol;
              const profit_delta = new_profit - cur_profit;

              const projections: any[] = [];
              const steps = [-0.10, -0.05, 0.0, 0.05, 0.10];
              for (const step of steps) {
                const p = new_p * (1 + step);
                const v = Math.max(0, Math.round(volume * (1 + elasticity * ((p - current_p) / current_p))));
                projections.push({
                  label: `${step >= 0 ? '+' : ''}${step * 100}% P`,
                  price: Math.round(p * 100) / 100,
                  revenue: Math.round((p * v) * 100) / 100
                });
              }

              toolResult = {
                new_volume: new_vol,
                volume_change_percent: Math.round(volume_change * 10000) / 10000,
                current_monthly_revenue: Math.round(cur_rev * 100) / 100,
                new_monthly_revenue: Math.round(new_rev * 100) / 100,
                revenue_change: Math.round(rev_delta * 100) / 100,
                revenue_change_percent: cur_rev > 0 ? Math.round((rev_delta / cur_rev) * 10000) / 10000 : 0,
                current_monthly_profit: Math.round(cur_profit * 100) / 100,
                new_monthly_profit: Math.round(new_profit * 100) / 100,
                profit_change: Math.round(profit_delta * 100) / 100,
                projections
              };
              // Auto-render ScenarioChart — don't wait for Gemini to chain render_scenario_chart
              innerGenUIPayload = {
                componentName: 'ScenarioChart',
                props: {
                  scenario_type: 'pricing',
                  title: `Simulasi Dampak Perubahan Harga (${current_p} → ${new_p})`,
                  summary_metrics: toolResult,
                  projections,
                  reasoning_trail: { dataSources: ['Pricing Calculator'], assumptions: [`Harga lama: ${current_p}`, `Harga baru: ${new_p}`, `Elastisitas: ${elasticity}`], confidenceScore: 0.82, confidenceLabel: 'High' }
                }
              };
              innerReplyText = 'Simulasi dampak perubahan harga berhasil dihitung:';
            }
            else if (call.name === 'generate_board_report_draft') {
              const args = call.args as any;
              const reportType = args.report_type || "board";
              const period = args.period || "Periode Saat Ini";

              const financeData = getFixture('finance.json') || {};
              const currMonth = financeData.current_month || {};
              const cashBalance = currMonth.cash_balance || 750000000;
              const monthlyRevenue = currMonth.mrr || 180000000;
              const runway = currMonth.cash_runway_months || 8.2;

              const crmData = getFixture('crm.json') || {};
              const openDeals = crmData.sales_pipeline?.open_deals || 12;
              const dealsValue = crmData.sales_pipeline?.pipeline_value || 450000000;
              const nps = crmData.customer_health?.nps_score || 72;
              const churn = crmData.customer_health?.churn_rate_percent || 1.8;

              let decisionsList: string[] = [];
              try {
                const q = query(collection(db, "decisions"), where("userId", "==", username), firestoreLimit(5));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                  const data = doc.data();
                  decisionsList.push(`- **${data.title}**: ${data.decisionMade} (Alasan: ${data.rationale})`);
                });
              } catch (err) {
                console.error("Failed to query decisions for report:", err);
              }

              if (decisionsList.length === 0) {
                decisionsList.push("- *Tidak ada keputusan strategis baru yang tercatat pada periode ini.*");
              }
              const decisionsText = decisionsList.join("\n");
              const title = `Laporan Kinerja ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - ${period}`;
              const formattedDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

              let contentMarkdown = "";
              if (reportType === "investor") {
                contentMarkdown = `# ${title}\n**Kepada**: Pemegang Saham & Investor Future Chief of Staff (CoS)\n**Tanggal**: ${formattedDate}\n**Periode**: ${period}\n\n---\n\n## 1. Ringkasan Eksekutif\nBisnis beroperasi dengan kinerja solid pada periode ${period}. Fokus utama kami adalah ekspansi pasar dan optimalisasi retensi pelanggan. Cash runway saat ini berada di level aman mendukung pertumbuhan berkelanjutan.\n\n## 2. Metrik Keuangan Kunci (Financial Health)\n*   **Pendapatan Bulanan (MRR)**: Rp ${new Intl.NumberFormat("id-ID").format(monthlyRevenue)}\n*   **Saldo Kas & Setara Kas**: Rp ${new Intl.NumberFormat("id-ID").format(cashBalance)}\n*   **Cash Runway**: ${runway} Bulan\n\n## 3. Metrik Pertumbuhan & Sales (CRM)\n*   **Pipeline Sales Aktif**: ${openDeals} Kesepakatan (Total Nilai: Rp ${new Intl.NumberFormat("id-ID").format(dealsValue)})\n*   **Net Promoter Score (NPS)**: ${nps}\n*   **Tingkat Churn Bulanan**: ${churn}%\n\n## 4. Keputusan Strategis & Penggunaan Dana\n${decisionsText}\n\n---\n*Dibuat secara otomatis oleh Future Chief of Staff (CoS) Assistant.*`;
              } else {
                contentMarkdown = `# ${title}\n**Kepada**: Dewan Direksi & Komisaris\n**Tanggal**: ${formattedDate}\n**Periode**: ${period}\n**Klasifikasi**: Rahasia / Internal Only\n\n---\n\n## I. Tinjauan Finansial & Tata Kelola\nLaporan tata kelola kinerja keuangan dan rencana alokasi modal perusahaan.\n*   **Total Kas Tersedia**: Rp ${new Intl.NumberFormat("id-ID").format(cashBalance)}\n*   **Kesehatan Kas**: Runway kas ${runway} bulan memberikan fleksibilitas operasional yang memadai.\n*   **Pendapatan Operasional Bulanan**: Rp ${new Intl.NumberFormat("id-ID").format(monthlyRevenue)}\n\n## II. Operasional & Manajemen Hubungan Pelanggan (CRM)\n*   **Aktivitas Pipeline**: Penjualan menunjukkan prospek kuat dengan ${openDeals} open deals senilai Rp ${new Intl.NumberFormat("id-ID").format(dealsValue)}.\n*   **Kepuasan Pelanggan**: NPS bertahan tinggi di angka ${nps}, dengan target mempertahankan churn di bawah 2% (saat ini ${churn}%).\n\n## III. Log Keputusan Tata Kelola Board\nBerikut adalah keputusan-keputusan strategis utama yang diambil dan memerlukan pengawasan Board:\n${decisionsText}\n\n## IV. Rencana Tindak Lanjut (Next Steps)\n1. Menjaga stabilitas runway dengan pengendalian burn rate bulanan.\n2. Mempercepat siklus closing sales pipeline.\n3. Optimalisasi onboarding staf kunci baru.\n\n---\n*Laporan ini disajikan untuk keperluan evaluasi Dewan Direksi.*`;
              }

              toolResult = {
                title,
                report_type: reportType,
                period,
                content_markdown: contentMarkdown,
                generated_at: new Date().toISOString()
              };
              // Auto-render the report card immediately — don't wait for Gemini to chain render_report_card
              innerGenUIPayload = {
                componentName: 'ReportCard',
                props: { title, report_type: reportType, period, content_markdown: contentMarkdown }
              };
              innerReplyText = "Berikut adalah draf laporan Board/Investor Anda:";
            }
            else if (call.name === 'fetch_market_intelligence') {
              const args = call.args as any;
              const queryText = (args.query_text || '').toLowerCase();
              const forceRefresh = args.force_refresh || false;
              const cacheId = queryText.replace(/\s+/g, "_").substring(0, 32);

              let cacheHit = false;
              let cachedAtStr = "";
              let results: any[] = [];
              let insights = "";

              if (!forceRefresh) {
                try {
                  const docSnap = await getDoc(doc(db, "market_intelligence_cache", cacheId));
                  if (docSnap.exists()) {
                    const cacheData = docSnap.data();
                    const cachedAt = new Date(cacheData.cached_at);
                    const now = new Date();
                    const ageInHours = Math.abs(now.getTime() - cachedAt.getTime()) / 36e5;

                    if (ageInHours < 24) {
                      cacheHit = true;
                      cachedAtStr = cacheData.cached_at;
                      results = cacheData.results || [];
                      insights = cacheData.insights || "";
                    }
                  }
                } catch (err) {
                  console.error("Firestore read cache error:", err);
                }
              }

              if (!cacheHit) {
                const fullSearchData = getFixture('search_results.json') || {};
                const list = fullSearchData.pricing_competitors || [];
                const filtered = list.filter((comp: any) =>
                  comp.competitor.toLowerCase().includes(queryText) ||
                  comp.pricing_plans.toLowerCase().includes(queryText)
                ).map((comp: any) => ({
                  title: `Pricing updates for ${comp.competitor}`,
                  url: comp.url,
                  snippet: `Plans: ${comp.pricing_plans}. Recent changes: ${comp.recent_updates}`,
                  published_date: "2026-07-01",
                  source: comp.competitor
                }));

                results = filtered.length > 0 ? filtered : list.map((comp: any) => ({
                  title: `Pricing updates for ${comp.competitor}`,
                  url: comp.url,
                  snippet: `Plans: ${comp.pricing_plans}. Recent changes: ${comp.recent_updates}`,
                  published_date: "2026-07-01",
                  source: comp.competitor
                }));

                insights = `Hasil analisis intelijen pasar menunjukkan update kompetitor terkini mengenai ${queryText}. Ditemukan ${results.length} artikel referensi penting. Tren utama menunjukkan peningkatan fitur otomatisasi operasional dan simplifikasi skema harga berlangganan.`;
                cachedAtStr = new Date().toISOString();

                try {
                  await setDoc(doc(db, "market_intelligence_cache", cacheId), {
                    query: queryText,
                    results,
                    insights,
                    cached_at: cachedAtStr
                  });
                } catch (err) {
                  console.error("Firestore write cache error:", err);
                }
              }

              toolResult = {
                query: queryText,
                results,
                insights,
                cached_at: cachedAtStr,
                cache_hit: cacheHit
              };
              // Auto-render MarketDigestCard — don't wait for Gemini to chain render_market_digest_card
              innerGenUIPayload = {
                componentName: 'MarketDigestCard',
                props: { query: queryText, results, insights, cached_at: cachedAtStr, cache_hit: cacheHit }
              };
              innerReplyText = "Berikut adalah ringkasan intelijen pasar dan kompetitor:";
            }

            // ── RENDER TOOLS: set genUIPayload inside the loop, feed dummy result, then break ──
            if (call.name === 'render_report_card') {
              const args = call.args as any;
              innerGenUIPayload = {
                componentName: 'ReportCard',
                props: {
                  title: args.title,
                  report_type: args.report_type,
                  period: args.period,
                  content_markdown: args.content_markdown
                }
              };
              innerReplyText = "Berikut adalah draf laporan Board/Investor Anda:";
              toolResult = { rendered: true };
            }
            else if (call.name === 'render_scenario_chart') {
              const args = call.args as any;
              innerGenUIPayload = {
                componentName: 'ScenarioChart',
                props: {
                  scenario_type: args.scenario_type,
                  title: args.title,
                  summary_metrics: args.summary_metrics || {},
                  projections: args.projections || [],
                  reasoning_trail: args.reasoning_trail || {}
                }
              };
              innerReplyText = "Berikut adalah bagan proyeksi skenario What-If Anda:";
              toolResult = { rendered: true };
            }
            else if (call.name === 'render_decision_log_card') {
              const args = call.args as any;
              innerGenUIPayload = {
                componentName: 'DecisionLogCard',
                props: {
                  title: args.title,
                  description: args.description,
                  decision_made: args.decision_made,
                  rationale: args.rationale,
                  assumptions: args.assumptions || [],
                  alternatives_considered: args.alternatives_considered || [],
                  confidence_score: args.confidence_score,
                  data_sources: args.data_sources || [],
                  tags: args.tags || []
                }
              };
              innerReplyText = "Berikut adalah draf pencatatan keputusan strategis Anda:";
              toolResult = { rendered: true };
            }
            else if (call.name === 'render_market_digest_card') {
              const args = call.args as any;
              innerGenUIPayload = {
                componentName: 'MarketDigestCard',
                props: {
                  query: args.query,
                  results: args.results || [],
                  insights: args.insights,
                  cached_at: args.cached_at,
                  cache_hit: args.cache_hit
                }
              };
              innerReplyText = "Berikut adalah ringkasan intelijen pasar kompetitor:";
              toolResult = { rendered: true };
            }
            else if (call.name === 'renderBriefingCard') {
              const args = call.args as any;
              innerGenUIPayload = {
                componentName: 'BriefingCard',
                props: {
                  highlights: args.highlights || [],
                  metrics: args.metrics || {},
                  agenda: args.agenda || [],
                  reasoning_trail: args.reasoning_trail || {}
                }
              };
              innerReplyText = "Berikut adalah Briefing Eksekutif Harian Anda hari ini:";
              toolResult = { rendered: true };
            }

            if (toolResult !== null) {
              console.log(`[API Agent Loop] Feeding back tool result for ${call.name}`);
              chatResult = await chat.sendMessage([
                {
                  functionResponse: {
                    name: call.name,
                    response: { result: toolResult }
                  }
                }
              ]);
              response = await chatResult.response;
              // If this was a render tool, break out now — we have our payload
              if (innerGenUIPayload) {
                functionCalls = [];
                break;
              }
              functionCalls = response.functionCalls();
            } else {
              break;
            }
          }

          successfulKeyIndex = i;
          successfulModel = modelName;
          console.log(`Gemini API request succeeded using model ${modelName} and key index ${i}`);
          break modelLoop; // Request succeeded! Break both loops
        } catch (error: any) {
          console.warn(`Gemini API Model ${modelName} with Key index ${i} failed. Error:`, error.message || error);
          const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
          
          if (isRateLimit) {
            rateLimitHit = true;
          }

          console.warn(`Attempt failed for model ${modelName} with key index ${i}. Trying next option...`);
          continue; // Selalu coba opsi berikutnya jika ada kegagalan apa pun
        }
      }
    }

    if (!response) {
      if (rateLimitHit) {
        return NextResponse.json({ 
          text: "Maaf, kuota Gemini API Key Anda sedang habis atau terkena batas limit (Rate Limit / Too Many Requests). Silakan tunggu sekitar 1-2 menit sebelum mencoba kembali." 
        });
      }
      throw new Error("Failed to get response from Gemini API");
    }
    
    const functionCalls = response.functionCalls();
    let genUIPayload = null;
    let replyText = response.text() || "";

    // If a render tool was handled inside the agentic loop, use those results directly
    if (innerGenUIPayload) {
      genUIPayload = innerGenUIPayload;
      if (!replyText) replyText = innerReplyText;
    } else if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === 'updateAndRenderTasks') {
        const args = call.args as any;
        const items = args.items || [];
        writeTasks(items, username);
        genUIPayload = {
          componentName: 'TaskList',
          props: { items }
        };
        if (!replyText) replyText = "Daftar tugas telah diperbarui sesuai permintaan Anda:";
      } 
      else if (call.name === 'renderProjectSummary') {
        genUIPayload = {
          componentName: 'ProjectSummary',
          props: call.args
        };
        if (!replyText) replyText = "Ini dia ringkasan proyek yang Anda tanyakan:";
      }
      else if (call.name === 'createProject') {
        const args = call.args as any;
        const projName = args.projectName;
        const newId = createProject(projName, username);
        genUIPayload = {
          componentName: 'ProjectSwitch',
          props: {
            action: 'create',
            projectId: newId,
            projectName: projName,
            projects: listUserProjects(username)
          }
        };
        if (!replyText) replyText = `Proyek baru "${projName}" berhasil dibuat dan sekarang aktif.`;
      }
      else if (call.name === 'switchProject') {
        const args = call.args as any;
        const target = args.projectNameOrId;
        const projects = listUserProjects(username);
        const found = projects.find(p => p.id === target || p.name.toLowerCase() === target.toLowerCase());
        if (found) {
          switchProject(found.id, username);
          const newTasks = readTasks(username);
          genUIPayload = {
            componentName: 'ProjectSwitch',
            props: {
              action: 'switch',
              projectId: found.id,
              projectName: found.name,
              tasks: newTasks,
              projects: listUserProjects(username)
            }
          };
          if (!replyText) replyText = `Pindah ke proyek "${found.name}" berhasil.`;
        } else {
          if (!replyText) replyText = `Proyek "${target}" tidak ditemukan. Silakan buat proyek baru jika perlu.`;
        }
      }
      else if (call.name === 'listProjects') {
        const projects = listUserProjects(username);
        genUIPayload = {
          componentName: 'ProjectList',
          props: {
            projects
          }
        };
        if (!replyText) replyText = "Berikut adalah daftar semua proyek Anda:";
      }
      else if (call.name === 'updateProjectNotes') {
        const args = call.args as any;
        const notes = args.notes || "";
        writeNotes(notes, username);
        genUIPayload = {
          componentName: 'ProjectNotes',
          props: { notes }
        };
        if (!replyText) replyText = "Catatan proyek telah berhasil diperbarui dan disimpan.";
      }
      else if (call.name === 'renderBriefingCard') {
        const args = call.args as any;
        genUIPayload = {
          componentName: 'BriefingCard',
          props: {
            highlights: args.highlights || [],
            metrics: args.metrics || {},
            agenda: args.agenda || [],
            reasoning_trail: args.reasoning_trail || {}
          }
        };
        if (!replyText) replyText = "Berikut adalah Briefing Eksekutif Harian Anda hari ini:";
      }
      else if (call.name === 'render_decision_log_card') {
        const args = call.args as any;
        genUIPayload = {
          componentName: 'DecisionLogCard',
          props: {
            title: args.title,
            description: args.description,
            decision_made: args.decision_made,
            rationale: args.rationale,
            assumptions: args.assumptions || [],
            alternatives_considered: args.alternatives_considered || [],
            confidence_score: args.confidence_score,
            data_sources: args.data_sources || [],
            tags: args.tags || []
          }
        };
        if (!replyText) replyText = "Berikut adalah draf pencatatan keputusan strategis Anda:";
      }
      else if (call.name === 'render_scenario_chart') {
        const args = call.args as any;
        genUIPayload = {
          componentName: 'ScenarioChart',
          props: {
            scenario_type: args.scenario_type,
            title: args.title,
            summary_metrics: args.summary_metrics || {},
            projections: args.projections || [],
            reasoning_trail: args.reasoning_trail || {}
          }
        };
        if (!replyText) replyText = "Berikut adalah bagan proyeksi skenario What-If Anda:";
      }
      else if (call.name === 'render_report_card') {
        const args = call.args as any;
        genUIPayload = {
          componentName: 'ReportCard',
          props: {
            title: args.title,
            report_type: args.report_type,
            period: args.period,
            content_markdown: args.content_markdown
          }
        };
        if (!replyText) replyText = "Berikut adalah draf laporan Board/Investor Anda:";
      }
      else if (call.name === 'render_market_digest_card') {
        const args = call.args as any;
        genUIPayload = {
          componentName: 'MarketDigestCard',
          props: {
            query: args.query,
            results: args.results || [],
            insights: args.insights,
            cached_at: args.cached_at,
            cache_hit: args.cache_hit
          }
        };
        if (!replyText) replyText = "Berikut adalah ringkasan intelijen pasar kompetitor:";
      }
    }

    return NextResponse.json({
      text: replyText,
      genUI: genUIPayload
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ 
        text: "Maaf, kuota Gemini API Key Anda sedang habis atau terkena batas limit (Rate Limit / Too Many Requests). Silakan tunggu sekitar 1-2 menit sebelum mencoba kembali." 
      });
    }
    return NextResponse.json({ text: "Terjadi kesalahan saat menghubungi server AI." }, { status: 500 });
  }
}
