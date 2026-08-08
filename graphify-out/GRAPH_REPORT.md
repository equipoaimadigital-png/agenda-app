# Graph Report - .  (2026-08-08)

## Corpus Check
- Corpus is ~24,619 words - fits in a single context window. You may not need a graph.

## Summary
- 358 nodes · 654 edges · 32 communities (23 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.83)
- Token cost: 212,048 input · 0 output

## Community Hubs (Navigation)
- Client Booking Flow UI
- Professional Dashboard Pages
- Authentication and Session Flow
- TypeScript Compiler Config
- Runtime Dependencies
- Booking Management and Email
- Dev Tooling Dependencies
- Graphify Extraction Rules
- Graphify Pipeline Stages
- Graphify Automation and Hooks
- Graphify Corpus Ingest Commands
- Free AI/ML Learning Roadmap
- Graph Query and Traversal
- Next.js Project Agent Rules
- Graphify Build Guards and MCP
- Subagent Dispatch and Wiki Export
- Repo Cloning and Graph Merge
- Root Layout and Fonts
- Globe Icon Asset
- Next.js Wordmark Asset
- Window Icon Asset
- Middleware Proxy
- Graph Database Exports
- ESLint Configuration
- Next.js Configuration
- PostCSS Configuration
- Vercel Logo Asset
- Vercel Cron Config
- SVG and GraphML Exports
- File Icon Asset

## God Nodes (most connected - your core abstractions)
1. `getCurrentProfessional()` - 23 edges
2. `prisma` - 16 edges
3. `compilerOptions` - 16 edges
4. `formatDateLong()` - 15 edges
5. `createSupabaseServerClient()` - 13 edges
6. `daySlots()` - 12 edges
7. `wallClockOf()` - 11 edges
8. `Graphify Pipeline (Steps 0-9)` - 11 edges
9. `Extraction Subagent Prompt` - 11 edges
10. `requireProfessional()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Building and Evaluating Advanced RAG` --semantically_similar_to--> `Graphify Pipeline (Steps 0-9)`  [INFERRED] [semantically similar]
  httpscourse.fast.ai (fast.ai — Prac.txt → .claude/skills/graphify/SKILL.md
- `Vercel Deployment` --conceptually_related_to--> `Post-Commit Auto-Rebuild Hook`  [AMBIGUOUS]
  README.md → .claude/skills/graphify/references/hooks.md
- `Read node_modules/next/dist/docs Before Coding` --semantically_similar_to--> `Graphify-First Codebase Question Rules`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `AI Agents in LangGraph` --semantically_similar_to--> `Graphify MCP stdio Server`  [INFERRED] [semantically similar]
  httpscourse.fast.ai (fast.ai — Prac.txt → .claude/skills/graphify/references/exports.md
- `Native CLAUDE.md Integration (graphify claude install)` --references--> `Graphify-First Codebase Question Rules`  [INFERRED]
  .claude/skills/graphify/references/hooks.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Semantic Extraction Flow (detect to merge)** — _claude_skills_graphify_skill_detect_files, _claude_skills_graphify_skill_extraction_cache, _claude_skills_graphify_skill_chunk_dispatch, _claude_skills_graphify_references_extraction_spec_subagent_prompt, _claude_skills_graphify_skill_merge_ast_semantic, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **Graph Integrity and Honesty Guards** — _claude_skills_graphify_skill_empty_graph_guard, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_honesty_rules, _claude_skills_graphify_references_extraction_spec_provenance_tags, _claude_skills_graphify_skill_html_viz_node_limit [INFERRED 0.85]
- **Free AI Learning Roadmap Sequence** — httpscourse_fast_ai__fast_ai___prac_fast_ai_course, httpscourse_fast_ai__fast_ai___prac_huggingface_llm_course, httpscourse_fast_ai__fast_ai___prac_huggingface_agents_course, httpscourse_fast_ai__fast_ai___prac_langchain_course, httpscourse_fast_ai__fast_ai___prac_advanced_rag_course, httpscourse_fast_ai__fast_ai___prac_langgraph_agents_course, httpscourse_fast_ai__fast_ai___prac_ml_specialization [EXTRACTED 1.00]

## Communities (32 total, 9 thin omitted)

### Community 0 - "Client Booking Flow UI"
Cohesion: 0.10
Nodes (43): DisponibilidadPage(), AgendaPage(), metadata, MiReservaPage(), PageProps, STATUS_LABEL, BookingWidget(), formatPrice() (+35 more)

### Community 1 - "Professional Dashboard Pages"
Cohesion: 0.11
Nodes (33): GET(), ConfiguracionPage(), DIAS, ORDEN, EstadisticasPage(), ServiciosPage(), generateMetadata(), loadProfessional() (+25 more)

### Community 2 - "Authentication and Session Flow"
Cohesion: 0.08
Nodes (24): ActualizarClavePage(), GET(), DashboardLayout(), ForgotPasswordForm(), State, LoginForm(), State, RegisterForm() (+16 more)

### Community 3 - "TypeScript Compiler Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (26): next, dependencies, next, prisma, @prisma/client, react, react-dom, resend (+18 more)

### Community 5 - "Booking Management and Email"
Cohesion: 0.22
Nodes (18): ManageBookingActions(), Props, cancelBookingByToken(), loadByToken(), rescheduleBookingByToken(), withinPolicy(), BookingEmailInfo, CancellationEmailInfo (+10 more)

### Community 6 - "Dev Tooling Dependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "Graphify Extraction Rules"
Cohesion: 0.19
Nodes (13): Call Edge Direction and Same-Language Rule, Discrete Confidence Score Rubric, Deep Mode Aggressive Inference, Hyperedges (3+ node group relations), Provenance Tags (EXTRACTED/INFERRED/AMBIGUOUS), Rationale Stored As Node Attribute, Verbatim source_file Rule, Extraction Subagent Prompt (+5 more)

### Community 8 - "Graphify Pipeline Stages"
Cohesion: 0.22
Nodes (11): Node ID Format Rule (full path stem), Part A - AST Structural Extraction, Cumulative Token Cost Tracker, Gemini Semantic Extraction Backend, Graph Health Check (integrity gate), Honesty Rules, HTML Visualization 5000-Node Limit, Part C - Merge AST + Semantic Extraction (+3 more)

### Community 9 - "Graphify Automation and Hooks"
Cohesion: 0.29
Nodes (10): Watch Debounce Window, Watch Mode Auto-Rebuild, Native CLAUDE.md Integration (graphify claude install), Post-Commit Auto-Rebuild Hook, Explain Node (/graphify explain), save-result Feedback Loop, Shortest Path Between Concepts (/graphify path), Work Memory and Reflect LESSONS.md (+2 more)

### Community 10 - "Graphify Corpus Ingest Commands"
Cohesion: 0.33
Nodes (9): Graphify Skill Trigger (/graphify), URL Ingest into Corpus (/graphify add), Token Reduction Benchmark, Whisper Video/Audio Transcription, Incremental Update (--update), Corpus Detection (detect), Semantic Extraction Cache (prompt-attributed), Graphify Pipeline (Steps 0-9) (+1 more)

### Community 11 - "Free AI/ML Learning Roadmap"
Cohesion: 0.28
Nodes (9): Building and Evaluating Advanced RAG, Agent Building as Most In-Demand Consulting Skill, Free AI/ML Learning Path (curated roadmap), fast.ai Practical Deep Learning for Coders, Free-First Learning Strategy (pay only for credentials), Hugging Face Agents Course, Hugging Face LLM Course, DeepLearning.AI LangChain for LLM Application Development (+1 more)

### Community 12 - "Graph Query and Traversal"
Cohesion: 0.29
Nodes (8): Semantic Similarity Edges, BFS and DFS Traversal Modes, Inline NetworkX Traversal Fallback, Constrained Query Expansion Against Graph Vocabulary, Token-Budget Aware Output Cap, Self-Composed Whisper Domain Hint from God Nodes, God Nodes and Surprising Connections, Graph As Map, Agent As Guide

### Community 13 - "Next.js Project Agent Rules"
Cohesion: 0.29
Nodes (8): Next.js Agent Rules Block, Read node_modules/next/dist/docs Before Coding, Block Regenerated by next dev (generate-agent-files.js), CLAUDE.md Imports AGENTS.md, Development Server (npm run dev), next/font Geist Optimization, Agenda App Next.js Project (create-next-app), Vercel Deployment

### Community 14 - "Graphify Build Guards and MCP"
Cohesion: 0.33
Nodes (7): Graphify MCP stdio Server, Build, Cluster and Analyze Graph, Empty Extraction Guard, Graphify Python Interpreter Resolution (uv/pipx/venv), PowerShell Scrolling Break from graspologic ANSI Output, graph.json Shrink Guard, AI Agents in LangGraph

### Community 15 - "Subagent Dispatch and Wiki Export"
Cohesion: 0.29
Nodes (7): Agent-Crawlable Wiki Export, Cluster-Only Rerun, Parallel Subagent Chunk Dispatch, Chunk File On Disk As Success Signal, Community Labeling, General-Purpose Subagent Requirement, Manifest Stamping for Incremental Runs

### Community 16 - "Repo Cloning and Graph Merge"
Cohesion: 0.40
Nodes (5): Cross-Repo Graph Merge, Monorepo Subfolder Extraction Then Merge, GitHub Repo Clone Cache, Corpus Size Gate and Subfolder Narrowing, Fast Path for Existing Graph

### Community 17 - "Root Layout and Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "Globe Icon Asset"
Cohesion: 0.67
Nodes (4): Globe Glyph as External/Web Link Affordance, Globe Icon Asset (globe.svg), 16px Monochrome Currentcolor-less Glyph Convention, Next.js Starter Template Asset (unmodified boilerplate)

### Community 19 - "Next.js Wordmark Asset"
Cohesion: 0.67
Nodes (3): Monochrome Vector Brand Asset Convention, Next.js Wordmark Logo (next.svg), Unmodified create-next-app Scaffold Asset

### Community 20 - "Window Icon Asset"
Cohesion: 0.67
Nodes (3): Monochrome 16x16 UI Glyph Convention, Next.js Starter Template Static Asset, Window Icon (window.svg)

## Ambiguous Edges - Review These
- `Graphify Python Interpreter Resolution (uv/pipx/venv)` → `PowerShell Scrolling Break from graspologic ANSI Output`  [AMBIGUOUS]
  .claude/skills/graphify/SKILL.md · relation: conceptually_related_to
- `Post-Commit Auto-Rebuild Hook` → `Vercel Deployment`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Next.js Starter Template Asset (unmodified boilerplate)` → `16px Monochrome Currentcolor-less Glyph Convention`  [AMBIGUOUS]
  public/globe.svg · relation: conceptually_related_to

## Knowledge Gaps
- **103 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Graphify Python Interpreter Resolution (uv/pipx/venv)` and `PowerShell Scrolling Break from graspologic ANSI Output`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Post-Commit Auto-Rebuild Hook` and `Vercel Deployment`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Next.js Starter Template Asset (unmodified boilerplate)` and `16px Monochrome Currentcolor-less Glyph Convention`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `prisma` connect `Professional Dashboard Pages` to `Client Booking Flow UI`, `Authentication and Session Flow`, `Booking Management and Email`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `getCurrentProfessional()` connect `Professional Dashboard Pages` to `Client Booking Flow UI`, `Authentication and Session Flow`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Graphify Pipeline (Steps 0-9)` connect `Graphify Corpus Ingest Commands` to `Graphify Automation and Hooks`, `Free AI/ML Learning Roadmap`, `Graphify Build Guards and MCP`, `Subagent Dispatch and Wiki Export`, `Repo Cloning and Graph Merge`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._