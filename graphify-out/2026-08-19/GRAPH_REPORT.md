# Graph Report - .  (2026-08-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 652 nodes · 1357 edges · 55 communities (37 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `688fc16b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- bookings.ts
- getCurrentProfessional
- email.ts
- auth.ts
- compilerOptions
- [id]/page.tsx
- dashboard.ts
- manual/page.tsx
- [slug]/page.tsx
- devDependencies
- suscripcion/page.tsx
- dependencies
- sms.ts
- Part B - Semantic Extraction (LLM)
- Extraction Subagent Prompt
- Free AI/ML Learning Path (curated roadmap)
- BFS and DFS Traversal Modes
- Graphify-First Codebase Question Rules
- Graphify Pipeline (Steps 0-9)
- Next.js Agent Rules Block
- scripts
- app/layout.tsx
- Agent-Crawlable Wiki Export
- Build, Cluster and Analyze Graph
- register
- package.json
- Globe Icon Asset (globe.svg)
- Next.js Wordmark Logo (next.svg)
- Window Icon (window.svg)
- backup.mjs
- privacidad/page.tsx
- robots.ts
- terminos/page.tsx
- proxy.ts
- FalkorDB Cypher Export and Push
- eslint.config.mjs
- next
- next.config.ts
- prisma
- @supabase/supabase-js
- postcss.config.mjs
- Next.js Starter Template Branding Asset
- instrumentation-client.ts
- vercel.json
- SVG and GraphML Exports
- File Document Icon (file.svg)

## God Nodes (most connected - your core abstractions)
1. `getCurrentProfessional()` - 41 edges
2. `prisma` - 30 edges
3. `formatDateLong()` - 29 edges
4. `requireDashboardAccess()` - 23 edges
5. `wallClockOf()` - 17 edges
6. `compilerOptions` - 16 edges
7. `createSupabaseServerClient()` - 15 edges
8. `createPublicBooking()` - 14 edges
9. `toDateStr()` - 13 edges
10. `weekdayOf()` - 12 edges

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

## Communities (55 total, 18 thin omitted)

### Community 0 - "bookings.ts"
Cohesion: 0.05
Nodes (84): RFC-5321, CampanasPage(), DisponibilidadPage(), EstadisticasPage(), AgendaPage(), PageProps, metadata, MiReservaPage() (+76 more)

### Community 1 - "getCurrentProfessional"
Cohesion: 0.07
Nodes (42): ConfiguracionPage(), SUBSCRIPTION_LABEL, DIAS, ORDEN, PageProps, ServiciosPage(), SoportePage(), StaffPage() (+34 more)

### Community 2 - "email.ts"
Cohesion: 0.08
Nodes (44): AUDIENCE_LABEL, DesuscribirPage(), metadata, PageProps, CampaignClientPicker(), ClientOption, Audience, AUDIENCE_OPTIONS (+36 more)

### Community 3 - "auth.ts"
Cohesion: 0.07
Nodes (29): ActualizarClavePage(), GET(), DashboardLayout(), AuthSplitLayout(), TRUST_ITEMS, ForgotPasswordForm(), State, LoginForm() (+21 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "[id]/page.tsx"
Cohesion: 0.14
Nodes (22): ClientDetailPage(), formatBirthday(), MONTHS_SHORT, STATUS_BADGE, ClientesPage(), formatBirthday(), MONTHS_SHORT, Client (+14 more)

### Community 6 - "dashboard.ts"
Cohesion: 0.15
Nodes (23): BookingRow(), BookingRowData, STATUS_BADGE, CancelDayButton(), OnboardingChecklist(), Props, addDateException(), cancelBookingByProfessional() (+15 more)

### Community 7 - "manual/page.tsx"
Cohesion: 0.18
Nodes (21): FAQ, IconComponent, ManualPage(), Section, SECTIONS, slug(), AUDIENCE, FEATURES (+13 more)

### Community 8 - "[slug]/page.tsx"
Cohesion: 0.19
Nodes (17): generateMetadata(), generateViewport(), isOpenNow(), loadProfessional(), PageProps, ReservarPage(), TRUST_ITEMS, OfflineDetector() (+9 more)

### Community 9 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 10 - "suscripcion/page.tsx"
Cohesion: 0.18
Nodes (14): POST(), STATUS_MAP, verifySignature(), formatPrice(), PageProps, SuscripcionPage(), startSubscriptionCheckout(), createSubscriptionInitPoint() (+6 more)

### Community 11 - "dependencies"
Cohesion: 0.12
Nodes (17): mercadopago, dependencies, mercadopago, @prisma/client, react, react-dom, resend, @sentry/nextjs (+9 more)

### Community 12 - "sms.ts"
Cohesion: 0.24
Nodes (11): GET(), fromNumber(), getClient(), ReminderSmsInfo, sendReminderSms(), toE164(), whenText(), fromNumber() (+3 more)

### Community 13 - "Part B - Semantic Extraction (LLM)"
Cohesion: 0.22
Nodes (11): Node ID Format Rule (full path stem), Part A - AST Structural Extraction, Cumulative Token Cost Tracker, Gemini Semantic Extraction Backend, Graph Health Check (integrity gate), Honesty Rules, HTML Visualization 5000-Node Limit, Part C - Merge AST + Semantic Extraction (+3 more)

### Community 14 - "Extraction Subagent Prompt"
Cohesion: 0.19
Nodes (13): Call Edge Direction and Same-Language Rule, Discrete Confidence Score Rubric, Deep Mode Aggressive Inference, Hyperedges (3+ node group relations), Provenance Tags (EXTRACTED/INFERRED/AMBIGUOUS), Rationale Stored As Node Attribute, Verbatim source_file Rule, Extraction Subagent Prompt (+5 more)

### Community 15 - "Free AI/ML Learning Path (curated roadmap)"
Cohesion: 0.24
Nodes (11): Graphify MCP stdio Server, Building and Evaluating Advanced RAG, Agent Building as Most In-Demand Consulting Skill, Free AI/ML Learning Path (curated roadmap), fast.ai Practical Deep Learning for Coders, Free-First Learning Strategy (pay only for credentials), Hugging Face Agents Course, Hugging Face LLM Course (+3 more)

### Community 16 - "BFS and DFS Traversal Modes"
Cohesion: 0.15
Nodes (14): Token Reduction Benchmark, Semantic Similarity Edges, Cross-Repo Graph Merge, Monorepo Subfolder Extraction Then Merge, GitHub Repo Clone Cache, BFS and DFS Traversal Modes, Inline NetworkX Traversal Fallback, Constrained Query Expansion Against Graph Vocabulary (+6 more)

### Community 17 - "Graphify-First Codebase Question Rules"
Cohesion: 0.29
Nodes (10): Watch Debounce Window, Watch Mode Auto-Rebuild, Native CLAUDE.md Integration (graphify claude install), Post-Commit Auto-Rebuild Hook, Explain Node (/graphify explain), save-result Feedback Loop, Shortest Path Between Concepts (/graphify path), Work Memory and Reflect LESSONS.md (+2 more)

### Community 18 - "Graphify Pipeline (Steps 0-9)"
Cohesion: 0.39
Nodes (8): Graphify Skill Trigger (/graphify), URL Ingest into Corpus (/graphify add), Whisper Video/Audio Transcription, Incremental Update (--update), Corpus Detection (detect), Semantic Extraction Cache (prompt-attributed), Graphify Pipeline (Steps 0-9), Obsidian Vault Export (opt-in)

### Community 19 - "Next.js Agent Rules Block"
Cohesion: 0.29
Nodes (8): Next.js Agent Rules Block, Read node_modules/next/dist/docs Before Coding, Block Regenerated by next dev (generate-agent-files.js), CLAUDE.md Imports AGENTS.md, Development Server (npm run dev), next/font Geist Optimization, Agenda App Next.js Project (create-next-app), Vercel Deployment

### Community 20 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, backup, build, dev, lint, postinstall, start, test

### Community 21 - "app/layout.tsx"
Cohesion: 0.25
Nodes (6): fraunces, metadata, playfair, plexMono, poppins, workSans

### Community 22 - "Agent-Crawlable Wiki Export"
Cohesion: 0.29
Nodes (7): Agent-Crawlable Wiki Export, Cluster-Only Rerun, Parallel Subagent Chunk Dispatch, Chunk File On Disk As Success Signal, Community Labeling, General-Purpose Subagent Requirement, Manifest Stamping for Incremental Runs

### Community 23 - "Build, Cluster and Analyze Graph"
Cohesion: 0.50
Nodes (5): Build, Cluster and Analyze Graph, Empty Extraction Guard, Graphify Python Interpreter Resolution (uv/pipx/venv), PowerShell Scrolling Break from graspologic ANSI Output, graph.json Shrink Guard

### Community 25 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 26 - "Globe Icon Asset (globe.svg)"
Cohesion: 0.67
Nodes (4): Globe Glyph as External/Web Link Affordance, Globe Icon Asset (globe.svg), 16px Monochrome Currentcolor-less Glyph Convention, Next.js Starter Template Asset (unmodified boilerplate)

### Community 27 - "Next.js Wordmark Logo (next.svg)"
Cohesion: 0.67
Nodes (3): Monochrome Vector Brand Asset Convention, Next.js Wordmark Logo (next.svg), Unmodified create-next-app Scaffold Asset

### Community 28 - "Window Icon (window.svg)"
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
- **169 isolated node(s):** `eslintConfig`, `config`, `WEEKDAYS_ES`, `MONTHS_ES`, `globalForPrisma` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Graphify Python Interpreter Resolution (uv/pipx/venv)` and `PowerShell Scrolling Break from graspologic ANSI Output`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Post-Commit Auto-Rebuild Hook` and `Vercel Deployment`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Next.js Starter Template Asset (unmodified boilerplate)` and `16px Monochrome Currentcolor-less Glyph Convention`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `getCurrentProfessional()` connect `getCurrentProfessional` to `bookings.ts`, `email.ts`, `auth.ts`, `[id]/page.tsx`, `dashboard.ts`, `manual/page.tsx`, `suscripcion/page.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `prisma` connect `getCurrentProfessional` to `bookings.ts`, `email.ts`, `auth.ts`, `[id]/page.tsx`, `dashboard.ts`, `[slug]/page.tsx`, `suscripcion/page.tsx`, `sms.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `formatDateLong()` connect `bookings.ts` to `getCurrentProfessional`, `email.ts`, `[id]/page.tsx`, `suscripcion/page.tsx`, `sms.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `config`, `WEEKDAYS_ES` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._