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
        description: "Mandatory when the user wants to ADD, CHANGE STATUS, DELETE, or VIEW the task list. You must return the ENTIRE updated tasks array along with their category and priority.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            items: {
              type: SchemaType.ARRAY,
              description: "Complete array of tasks after additions/modifications/deletions.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING, description: "Use UUID or unique ID (e.g.: 'task-1')" },
                  title: { type: SchemaType.STRING, description: "Task title" },
                  status: { type: SchemaType.STRING, description: "Only fill with 'completed' or 'pending'" },
                  priority: { type: SchemaType.STRING, description: "Task priority level: 'High', 'Medium', or 'Low'." },
                  category: { type: SchemaType.STRING, description: "Task category: 'Tech', 'Design', 'Marketing', 'Personal', or 'Admin'." },
                  dueDate: { type: SchemaType.STRING, description: "Due date with YYYY-MM-DD format (e.g.: '2026-07-15') if specified by the user." },
                  subtasks: {
                    type: SchemaType.ARRAY,
                    description: "Optional hierarchical list of subtasks to break down the main task into a detailed checklist.",
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        id: { type: SchemaType.STRING, description: "Unique ID of the subtask (e.g.: 'subtask-1')" },
                        title: { type: SchemaType.STRING, description: "Subtask title" },
                        status: { type: SchemaType.STRING, description: "Only fill with 'completed' or 'pending'" }
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
            status: { type: SchemaType.STRING, description: "Project status: 'On Track', 'At Risk', or 'Off Track'." }
          },
          required: ["projectName", "summary", "status"]
        }
      },
      {
        name: "createProject",
        description: "Create a new project or task board with a specific name.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            projectName: { type: SchemaType.STRING, description: "Name of the new project to be created." }
          },
          required: ["projectName"]
        }
      },
      {
        name: "switchProject",
        description: "Switch to another project/task board based on project name or ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            projectNameOrId: { type: SchemaType.STRING, description: "Target project name or ID to switch to." }
          },
          required: ["projectNameOrId"]
        }
      },
      {
        name: "listProjects",
        description: "View the list of all current projects of the user.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      },
      {
        name: "updateProjectNotes",
        description: "Used to write, update, or delete active project notes/wiki. Use this when the user asks to save notes, write technical specs, meeting summaries, memos, or save key project information.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            notes: { type: SchemaType.STRING, description: "Entire text content of the new or updated project notes." }
          },
          required: ["notes"]
        }
      },
      {
        name: "fetchFinanceSummary",
        description: "Fetch financial data summary (P&L, cash flow, cash runway, expenses) from accounting system (Xero/Accurate).",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            period: { type: SchemaType.STRING, description: "Data period: 'current_month' or 'history'" }
          }
        }
      },
      {
        name: "fetchSalesHighlights",
        description: "Fetch sales pipeline summary (HubSpot CRM) containing sales targets, active deals, conversion, and stalled deals.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      },
      {
        name: "fetchCalendarToday",
        description: "Fetch today's meeting agenda and focus blocks from Google Calendar.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      },
      {
        name: "searchWeb",
        description: "Search for news, market trends, or competitor info online via search engine.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Search query keywords." }
          },
          required: ["query"]
        }
      },
      {
        name: "renderBriefingCard",
        description: "Display the Daily Executive Briefing card on user screen (Generative UI). Call this tool after you finish gathering and analyzing all data.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            highlights: {
              type: SchemaType.ARRAY,
              description: "List of today's critical event summaries. Each item has 'title', 'description', and 'severity' ('critical' | 'warning' | 'info').",
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
              description: "Key financial metrics (revenue, cashBalance, cashRunwayMonths, monthlyBurn).",
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
              description: "Today's important meeting agenda. Each item has 'time', 'title', 'attendees', 'isImportant', and 'preparationNote'.",
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
              description: "AI reasoning trail (dataSources, assumptions, confidenceScore, confidenceLabel, alternativeOptions, warnings).",
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
        description: "Save strategic business decisions taken into the Firestore Decision Log database.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: "Decision title (max 100 char)." },
            description: { type: SchemaType.STRING, description: "Description of decision background." },
            decision_made: { type: SchemaType.STRING, description: "Final decision outcome." },
            rationale: { type: SchemaType.STRING, description: "Main rationale for the decision." },
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
        description: "Search for similar decisions previously taken in the past.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Decision search keywords." }
          },
          required: ["query"]
        }
      },
      {
        name: "render_decision_log_card",
        description: "Display draft strategic decision record on user screen (Generative UI). Call this tool when AI detects a strategic decision discussion.",
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
            base_monthly_revenue: { type: SchemaType.NUMBER, description: "Current monthly revenue." },
            growth_rate_change: { type: SchemaType.NUMBER, description: "Perubahan persentase pertumbuhan bulanan (e.g. +0.02 = +2% growth)." },
            months: { type: SchemaType.INTEGER, description: "Jumlah bulan proyeksi (default 12)." },
            churn_rate: { type: SchemaType.NUMBER, description: "Persentase churn bulanan (default 0.02)." }
          },
          required: ["base_monthly_revenue", "growth_rate_change"]
        }
      },
      {
        name: "calculate_hiring_impact",
        description: "Calculate impact of staff additions (hiring) on monthly burn rate and cash runway.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            headcount_delta: { type: SchemaType.INTEGER, description: "Number of new staff." },
            avg_annual_salary: { type: SchemaType.NUMBER, description: "Average annual salary per staff." },
            ramp_months: { type: SchemaType.INTEGER, description: "Staff ramp-up time (months)." },
            revenue_per_head_monthly: { type: SchemaType.NUMBER, description: "Monthly revenue contribution per head." },
            current_cash: { type: SchemaType.NUMBER, description: "Current cash balance." },
            current_monthly_burn: { type: SchemaType.NUMBER, description: "Current monthly burn rate." }
          },
          required: ["headcount_delta", "avg_annual_salary"]
        }
      },
      {
        name: "calculate_pricing_impact",
        description: "Calculate price change impact on sales volume and gross margin based on price elasticity.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            current_price: { type: SchemaType.NUMBER, description: "Current selling price." },
            new_price: { type: SchemaType.NUMBER, description: "New selling price." },
            price_elasticity: { type: SchemaType.NUMBER, description: "Price elasticity coefficient (negative number, e.g. -0.5)." },
            current_volume: { type: SchemaType.INTEGER, description: "Current monthly sales volume." },
            cost_per_unit: { type: SchemaType.NUMBER, description: "COGS per unit." }
          },
          required: ["current_price", "new_price", "price_elasticity", "current_volume"]
        }
      },
      {
        name: "render_scenario_chart",
        description: "Display visual trend chart of What-If scenario on user chat screen (Generative UI). Call this tool after you finish calculations with scenario_tools.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            scenario_type: { type: SchemaType.STRING, description: "Simulation category: 'revenue_growth', 'hiring', or 'pricing'." },
            title: { type: SchemaType.STRING, description: "Simulation scenario title." },
            summary_metrics: {
              type: SchemaType.OBJECT,
              description: "Collection of key outcome metrics."
            },
            projections: {
              type: SchemaType.ARRAY,
              description: "List of monthly data points to draw on the chart.",
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
        description: "Fetch financial, CRM, and strategic decision data to generate a complete report draft for Board or Investor. Call this tool when report is requested.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            report_type: { type: SchemaType.STRING, description: "Report type: 'board' or 'investor'." },
            period: { type: SchemaType.STRING, description: "Report period, e.g. 'July 2026' or 'Q2 2026'." }
          },
          required: ["report_type", "period"]
        }
      },
      {
        name: "render_report_card",
        description: "Display Board/Investor report draft preview card on chat screen (Generative UI) with copy and download buttons. Call after generate_board_report_draft.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: "Report title." },
            report_type: { type: SchemaType.STRING, description: "Report type: 'board' or 'investor'." },
            period: { type: SchemaType.STRING, description: "Report period." },
            content_markdown: { type: SchemaType.STRING, description: "Report content in Markdown format." }
          },
          required: ["title", "report_type", "period", "content_markdown"]
        }
      },
      {
        name: "fetch_market_intelligence",
        description: "Search and retrieve market research, industry trends, and competitor info. Supports Firestore caching for reuse. Call when market research or competitor analysis is requested.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query_text: { type: SchemaType.STRING, description: "Search query keywords (e.g., 'project management SaaS competitor pricing')." },
            force_refresh: { type: SchemaType.BOOLEAN, description: "Set true to force refresh the latest data, ignoring cache." }
          },
          required: ["query_text"]
        }
      },
      {
        name: "render_market_digest_card",
        description: "Display market and competitor intelligence summary card (Generative UI). Call after fetch_market_intelligence returns data.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Search query keywords used." },
            results: {
              type: SchemaType.ARRAY,
              description: "List of competitor results/market news.",
              items: { type: SchemaType.OBJECT }
            },
            insights: { type: SchemaType.STRING, description: "Summary of AI analysis on market data." },
            cached_at: { type: SchemaType.STRING, description: "Time data was cached (ISO string)." },
            cache_hit: { type: SchemaType.BOOLEAN, description: "Whether the data is from cache." }
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
      return NextResponse.json({ text: "API Key is not configured." }, { status: 500 });
    }

    const formattedHistory = history
      .filter((msg: any) => msg.id !== '1')
      .map((msg: any) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Filter history to strictly alternate between 'user' and 'model', starting with 'user'
    const cleanHistory: any[] = [];
    let expectedRole = 'user';
    for (const msg of formattedHistory) {
      if (msg.role === expectedRole) {
        cleanHistory.push(msg);
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    const currentNotes = readNotes(username);

    const systemPrompt = `You are the Future Chief of Staff (CoS) AI Assistant.
Currently active project name: "${activeProjectName}"
Your list of current projects: ${JSON.stringify(projectsList.map(p => p.name))}
Current Task List in project "${activeProjectName}" (in JSON): 
${JSON.stringify(currentTasks)}
Current Project Notes (Notes/Wiki):
"${currentNotes}"

RULES:
1. If the user asks to add a task, split a task into subtasks, change status, or delete a task, you MUST modify the JSON array above, and then call 'updateAndRenderTasks' function with the final array.
2. When ADDING a new task or if requested by the user, automatically classify priority and category. If the task is complex or large, automatically split it into multiple 'subtasks' with a default status of 'pending'. If the user mentions a deadline, due date, or timeline (e.g. "by tomorrow", "deadline July 20", etc.), convert it to ISO date format 'YYYY-MM-DD' (using the current active year 2026) and store it in the 'dueDate' field.
3. If the user asks for a project summary or overall current project status, you MUST call 'renderProjectSummary' function, compiling the summary description based on completion stats of the current task list. Determine project status: 'On Track' (if mostly complete/smooth), 'At Risk' (if many High priority tasks are incomplete), or 'Off Track'.
4. If the user asks to create a new project, call 'createProject' function with the new project name.
5. If the user asks to switch/change projects, call 'switchProject' function with the target project name.
6. If the user asks to view the list of projects, call 'listProjects' function.
7. If the user asks to record important information, write a memo, technical spec, meeting summary, or save info about the current project, you MUST call 'updateProjectNotes' function with the full note text.
8. If the user requests a Daily/Weekly Executive Briefing or morning summary, you MUST:
   a. Call 'fetchFinanceSummary', 'fetchSalesHighlights', and 'fetchCalendarToday' in parallel or sequence to gather business data.
   b. Perform implicit Agentic Loop analysis: PLAN (highlight critical anomalies), SELECT & EXECUTE, SYNTHESIZE, and SELF-REFLECT (check data completeness & confidence).
   c. Call 'renderBriefingCard' function with the generated data to render it as Generative UI.
9. If the user discusses or sets a strategic business decision (e.g., hiring new employees, funding, large expenses, product changes), you MUST call 'render_decision_log_card' function to display a draft of the strategic decision record. If the user explicitly approves, instructs to save, or confirms the decision, call 'save_decision_to_log'. To search for similar past decisions, call 'search_similar_decisions'.
10. If the user asks for a business scenario projection, impact analysis ("What-If"), or financial/hiring/pricing simulation (e.g. "what is the projection if we increase price by 10%?", "simulate if we hire 2 developers", "analyze runway if revenue increases"), you MUST ACT IMMEDIATELY without asking for additional data:
    a. DO NOT ask the user for financial data. Use reasonable default values: current_cash=750000000 (IDR 750 million), current_monthly_burn=91500000 (IDR 91.5 million), base_monthly_revenue=180000000 (IDR 180 million), price_elasticity=-0.5.
    b. Call the appropriate simulation function DIRECTLY ('calculate_revenue_scenario', 'calculate_hiring_impact', or 'calculate_pricing_impact') using data inferred from the conversation context + default values.
    c. Once the calculation results are obtained, DIRECTLY call 'render_scenario_chart' function supplying the calculation results to render it as a visual chart.
11. If the user requests a report for the Board of Directors or Investors (e.g. "make a draft of board report", "growth report for investors"), you MUST:
    a. Call 'generate_board_report_draft' function to compile metrics from the financial system, CRM, and Firestore decision log.
    b. Call 'render_report_card' function to display the full report draft along with copy & download buttons.
12. If the user asks for market research, competitor analysis, business trends, or market intelligence (e.g. "search competitor news", "how do competitor prices compare?"), you MUST:
    a. Call 'fetch_market_intelligence' function to search for info (with Firestore caching).
    b. Call 'render_market_digest_card' function to display the structured market and competitor intelligence summary.
13. For general questions outside the project management system and business analysis, reply with natural text. Always reply in professional, clear, and structured English.`;

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
                    outcome: data.outcome || "Not recorded",
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
                  title: `Revenue Projection Simulation (Growth +${Math.round(growth_change * 100)}%)`,
                  summary_metrics: toolResult,
                  projections,
                  reasoning_trail: { dataSources: ['Fixture Finance Data'], assumptions: [`Base revenue: IDR ${base_revenue.toLocaleString('en-US')}/mo`, `Growth rate: +${Math.round(growth_change * 100)}%/mo`, `Churn: ${Math.round(churn * 100)}%`], confidenceScore: 0.85, confidenceLabel: 'High' }
                }
              };
              innerReplyText = 'Revenue projection simulation calculated successfully:';
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
                  title: `Hiring Impact Simulation for ${headcount} New Staff`,
                  summary_metrics: toolResult,
                  projections,
                  reasoning_trail: { dataSources: ['Fixture Finance Data'], assumptions: [`Salary/year: IDR ${salary.toLocaleString('en-US')}`, `Ramp-up: ${ramp} months`], confidenceScore: 0.85, confidenceLabel: 'High' }
                }
              };
              innerReplyText = `Hiring impact simulation for ${headcount} new staff calculated successfully:`;
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
                  title: `Price Change Impact Simulation (${current_p} → ${new_p})`,
                  summary_metrics: toolResult,
                  projections,
                  reasoning_trail: { dataSources: ['Pricing Calculator'], assumptions: [`Old price: ${current_p}`, `New price: ${new_p}`, `Elasticity: ${elasticity}`], confidenceScore: 0.82, confidenceLabel: 'High' }
                }
              };
              innerReplyText = 'Price change impact simulation calculated successfully:';
            }
            else if (call.name === 'generate_board_report_draft') {
              const args = call.args as any;
              const reportType = args.report_type || "board";
              const period = args.period || "Current Period";

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
                  decisionsList.push(`- **${data.title}**: ${data.decisionMade} (Rationale: ${data.rationale})`);
                });
              } catch (err) {
                console.error("Failed to query decisions for report:", err);
              }

              if (decisionsList.length === 0) {
                decisionsList.push("- *No new strategic decisions recorded*");
              }
              const decisionsText = decisionsList.join("\n");
              const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Performance Report - {period}`;
              const formattedDate = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

              let contentMarkdown = "";
              if (reportType === "investor") {
                contentMarkdown = `# ${title}\n**To**: Shareholders & Investors of Future Chief of Staff (CoS)\n**Date**: ${formattedDate}\n**Period**: ${period}\n\n---\n\n## 1. Executive Summary\nThe business operated with solid performance during the period ${period}. Our primary focus remains on market expansion and customer retention optimization. The current cash runway is at a safe level, supporting sustainable growth.\n\n## 2. Key Financial Metrics (Financial Health)\n*   **Monthly Revenue (MRR)**: IDR ${new Intl.NumberFormat("en-US").format(monthlyRevenue)}\n*   **Cash & Cash Equivalents Balance**: IDR ${new Intl.NumberFormat("en-US").format(cashBalance)}\n*   **Cash Runway**: ${runway} Months\n\n## 3. Growth & Sales Metrics (CRM)\n*   **Active Sales Pipeline**: ${openDeals} Deals (Total Value: IDR ${new Intl.NumberFormat("en-US").format(dealsValue)})\n*   **Net Promoter Score (NPS)**: ${nps}\n*   **Monthly Churn Rate**: ${churn}%\n\n## 4. Strategic Decisions & Use of Funds\n${decisionsText}\n\n---\n*Automatically generated by Future Chief of Staff (CoS) Assistant.*`;
              } else {
                contentMarkdown = `# ${title}\n**To**: Board of Directors & Commissioners\n**Date**: ${formattedDate}\n**Period**: ${period}\n**Classification**: Confidential / Internal Only\n\n---\n\n## I. Financial & Governance Overview\nGovernance report on the company's financial performance and capital allocation plans.\n*   **Total Cash Available**: IDR ${new Intl.NumberFormat("en-US").format(cashBalance)}\n*   **Cash Health**: Cash runway of ${runway} months provides adequate operational flexibility.\n*   **Monthly Operating Revenue**: IDR ${new Intl.NumberFormat("en-US").format(monthlyRevenue)}\n\n## II. Operations & Customer Relationship Management (CRM)\n*   **Pipeline Activity**: Sales show a strong outlook with ${openDeals} open deals valued at IDR ${new Intl.NumberFormat("en-US").format(dealsValue)}.\n*   **Customer Satisfaction**: NPS remains high at ${nps}, with a target of keeping monthly churn below 2% (currently ${churn}%).\n\n## III. Board Governance Decision Log\nThe following are the key strategic decisions taken that require Board oversight:\n${decisionsText}\n\n## IV. Action Plan (Next Steps)\n1. Maintain runway stability by controlling the monthly burn rate.\n2. Accelerate the sales pipeline closing cycle.\n3. Optimize onboarding of new key staff.\n\n---\n*This report is presented for the evaluation of the Board of Directors.*`;
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
              innerReplyText = "Here is your draft Board/Investor report:";
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

                insights = `Market intelligence analysis shows the latest competitor updates regarding ${queryText}. Found ${results.length} key reference articles. Key trends point to enhanced operational automation features and simplified subscription pricing models.`;
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
              innerReplyText = "Here is the summary of market intelligence and competitors:";
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
              innerReplyText = "Here is your draft Board/Investor report:";
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
              innerReplyText = "Here is your What-If scenario projection chart:";
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
              innerReplyText = "Here is your strategic decision record draft:";
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
              innerReplyText = "Here is your competitor market intelligence summary:";
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
              innerReplyText = "Here is your Daily Executive Briefing for today:";
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
          continue; // Always try the next option if any failure occurs
        }
      }
    }

    if (!response) {
      if (rateLimitHit) {
        return NextResponse.json({ 
          text: "Sorry, your Gemini API Key quota is exhausted or rate limited (Rate Limit / Too Many Requests). Please wait 1-2 minutes before trying again." 
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
        if (!replyText) replyText = "The task list has been updated as requested:";
      } 
      else if (call.name === 'renderProjectSummary') {
        genUIPayload = {
          componentName: 'ProjectSummary',
          props: call.args
        };
        if (!replyText) replyText = "Here is the project summary you asked for:";
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
        if (!replyText) replyText = `New project "${projName}" created successfully and is now active.`;
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
          if (!replyText) replyText = `Successfully switched to project "${found.name}".`;
        } else {
          if (!replyText) replyText = `Project "${target}" not found. Please create a new project if needed.`;
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
        if (!replyText) replyText = "Here is the list of all your projects:";
      }
      else if (call.name === 'updateProjectNotes') {
        const args = call.args as any;
        const notes = args.notes || "";
        writeNotes(notes, username);
        genUIPayload = {
          componentName: 'ProjectNotes',
          props: { notes }
        };
        if (!replyText) replyText = "Project notes have been successfully updated and saved.";
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
        if (!replyText) replyText = "Here is your Daily Executive Briefing for today:";
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
        if (!replyText) replyText = "Here is your strategic decision record draft:";
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
        if (!replyText) replyText = "Here is your What-If scenario projection chart:";
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
        if (!replyText) replyText = "Here is your draft Board/Investor report:";
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
        if (!replyText) replyText = "Here is your competitor market intelligence summary:";
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
        text: "Sorry, your Gemini API Key quota is exhausted or rate limited. Please wait 1-2 minutes before trying again." 
      });
    }
    return NextResponse.json({ text: "An error occurred while contacting the AI server." }, { status: 500 });
  }
}
