# Product Requirement Document (PRD)

> **⚠️ Working transcript — not canonical (superseded 2026-07-11).** This is the
> raw v1 CodePulse brief. It was **distilled into [PRD_V2.md](./PRD_V2.md)**,
> which is the canonical yardstick (confirmed with the product owner
> 2026-07-11) and which resolves the open questions this document leaves
> hanging. Kept for history and for the reasoning behind decisions PRD_V2
> states without re-arguing.
>
> Read [STATUS.md](./STATUS.md) for what is actually built, and the
> [alignment review](./reviews/2026-07-11-codepulse-alignment-review.md) for how
> this brief maps onto the existing code and ADRs.

Project CodePulse (Working Title) — Multiverse Code Quality Tracker

1. Executive Summary & Purpose
   CodePulse is a centralized code quality and static analysis platform that enables developers and product owners to track, analyze, and quantify code health across multiple repositories over time.

Unlike traditional isolated linting tools, CodePulse bridges the gap between deterministic tooling (linters, type-checkers) and generative AI analysis (agentic LLM reviewers). By logging structural and computational analysis on every run, the platform turns raw terminal outputs into structured, historical insights, answering a critical question: Is our code getting better or worse?

Additionally, the platform maps the architecture of the codebases via an automated AST (Abstract Syntax Tree) graph engine to power dependency analysis, architectural insights, and agentic skills.

2. Core Constraints & Architectural Rules
   Sequential Execution Single-Thread Lock: During a project scan/run, the platform must enforce an absolute processing lock. No other scans can be triggered for any project—whether initiated via the UI or directly via the backend API—until the current run finishes or times out.

The Standarization Mandate: Every scanner output (whether standard text errors from ESLint or markdown summaries from an LLM) must be parsed and mapped into a uniform JSON schema to ensure smooth UI rendering and numerical trend analysis over time.

The Continuous Shadow Graph: The Graph Scanner is an omnipresent, system-level process. It cannot be disabled by users. It executes automatically on every run to update the system's structural database.

3. Epics & Feature Requirements
   3.1. Projects Management
   Acts as the central tenant for target codebases located locally on the developer's device (with an abstraction layer built to support remote repositories in future iterations).

Data Schema
project_id (UUIDv7, Primary Key)

project_name (String, Required)

project_description (Text, Optional)

project_path (String, Local filesystem path absolute/relative)

Audit Attributes: created_at, created_by, modified_at, modified_by, is_disabled, is_deleted (Soft Delete Flag), is_readonly.

Aggregated Analytics: last_run_at, last_run_status (Enum: Success, Failed, In_Progress), project_runs_number (Counter), project_scanners_number (Counter of attached scanners).

Functional Requirements
CRUD Actions: Create, Read, Update, and Soft Delete projects. Soft-deleted projects are hidden from the primary UI view but retained in the DB for historical analytic preservation.

Scan Invocation Engine: Provide a UI configuration panel to launch a run. The user must be allowed to select one or multiple specific scanners configured for the project.

3.2. Files Management (Skill Assets)
Manages custom auxiliary execution artifacts (Python scripts, JSON context documents, text prompts) that live inside a project's .skill ecosystem. These files are mapped to LLM scanners to dictate their agentic behaviors.

Data Schema
file_id (UUIDv7, Primary Key)

file_name (String, e.g., security_check.py)

file_description (Text)

file_extension (String, e.g., .py, .json, .txt)

Audit Attributes: created_at, created_by, modified_at, modified_by, is_disabled, is_deleted, is_readonly.

Functional Requirements
File Association Management: Allow developers to register files via the UI. These files physically reside or mirror into /scripts and /resources folders.

M2M Binding: Users can attach multiple files to a single LLM scanner, explicitly defining their operational context (type: script or type: resource).

3.3. Scanners Management
Defines the execution mechanisms running against the codebase. The architecture explicitly branches into two core variants alongside a background structural parser.

Data Schema
scanner_id (UUIDv7, Primary Key)

scanner_name (String)

scanner_description (Text)

Audit Attributes: created_at, created_by, modified_at, modified_by, is_disabled, is_deleted, is_readonly.

Aggregated Analytics: last_run_at, last_run_status, scanner_runs_number.

Type 1: Deterministic Scanners (Command Line Tools)
scanner_command (String, e.g., npx eslint . --format=json, biome check .)

Execution Behavior: Runs native binary commands on the host system shell, captures stdout/stderr, and routes it to the parsing parser.

Type 2: LLM Scanners (Agentic Code Evaluators)
scanner_skill_name (String, human-readable identifier for the agentic skill)

scanner_skill_description (Text)

scanner_skill_instructions (Text/System Prompt configuration block)

Skill Assets Linkage: Many-to-Many relational link mapping to Files Management with metadata designating the target vector (/scripts or /resources).

Execution Behavior: Runs via the platform's execution SDK, generating an agent environment utilizing the assigned scripts and system instructions.

Type 3: The System Graph Scanner (Read-Only)
Implicit Execution: Hidden from standard selection lists; triggered automatically alongside any standard run.

Mechanism: Executes a structural AST parser (e.g., via Oxlint, SWC, or Tree-sitter) to transform the source code into a highly granular graph layout.

Graph Depth: Must capture directory layouts, component/file nodes, functions, variables, down to function argument signatures.

Query Capabilities: Must be architected to resolve hierarchical queries quickly, such as "How many child leaves/functions exist inside src/components/Button?"

3.4. Scans & Run Life-Cycle Management
Tracks execution metadata, processing states, and technical code health metrics across three structured layers: Run (Master Orchestrator), Scan (Per-Scanner Job), and Scan Details (Outputs).

+-------------------------------------------------------------+
| RUN (Master Level) |
| Tracks overall execution time, global lock, total files |
+-------------------------------------------------------------+
|
v
+-------------------------------------------------------------+
| SCAN (Job Level) |
| Tracks individual Scanner lifecycles (e.g., Biome, LLM) |
+-------------------------------------------------------------+
|
v
+-------------------------------------------------------------+
| SCAN DETAILS (Data Level) |
| Stores exact outputs, error tokens, metrics & raw results |
+-------------------------------------------------------------+
Layer 1: Run (Master Orchestrator)
Tracks the lifecycle of an overall execution unit.

run_id (UUIDv7, Primary Key)

project_id (Foreign Key)

run_executed_at / run_started_at / run_finished_at (Timestamps)

run_executed_by (User ID string)

run_status (Enum: QUEUED, PROCESSING, COMPLETED, FAILED)

Metrics Columns: run_files_number (Total file count at time of run), run_scanners_executed (Integer).

Audit Attributes: created_at, created_by, modified_at, modified_by, is_deleted, is_readonly.

Layer 2: Scan (Individual Job Instance)
Tracks the isolated execution of a specific scanner inside the wider Run context.

run_id (Foreign Key, Compound PK component)

scanner_id (Foreign Key, Compound PK component)

scan_status (Enum: PENDING, RUNNING, SUCCESS, FAIL)

scan_started_at / scan_finished_at (Timestamps)

Metrics Block (Dynamically Structured per Scanner Engine):

Deterministic Example: { "errors": 12, "warnings": 45, "duration_ms": 1200 }

LLM Example: { "tokens_consumed": 4200, "critical_flaws_found": 2, "adherence_score": 88 }

Layer 3: Scan Details (The Output Store)
run_id (Foreign Key)

scanner_id (Foreign Key)

outputs (JSONB / Structured Data Object)

Must capture raw string output logs for debugging purposes.

Must store the standardized format mapping (normalized array of findings containing line numbers, severity level, affected code snippets, and textual summaries).

4. User Personas & Core User Flows
   Developer Flow: Run and Remediate
   Navigate to an active Project via the UI dash.

Hit "Trigger Scan" and multi-select ESLint (Deterministic) and Architecture Reviewer (LLM Skill).

The system enforces the system-wide execution lock.

The system updates the structural codebase graph. Simultaneously, ESLint runs and the LLM agent initializes using scripts configured from the /scripts directory.

Once complete, the system unlocks, renders visual delta lines showing whether error metrics dropped compared to the previous run, and updates the global metrics dashboard.

Product Owner Flow: Health Dashboard
Open the high-level analytics viewport.

Filter dashboards across target production projects.

Review graphs showing code changes over time, noting if code quality numbers are declining or improving across release windows.

5. Non-Functional Requirements & Security Metrics
   Performance: Deterministic scanners should stream output lines instantly to minimize process lock durations on small to mid-sized repos.

Process Isolation: LLM scanner agents must run in safe sandboxes so local script execution from the /scripts directory cannot cause unintended system level changes on the developer's machine.

Database Scaling: Because the system-level Graph Scanner maps codebases down to function arguments, the graph database tables must be indexed effectively (e.g., utilizing recursive CTEs or dedicated Graph features) to ensure fast lookup response times.

Where would you like to take this platform definition next?

Design the Database Schema Design

Define the Standarized Output JSON Schema

Draft the App Architecture & Execution Flow

let's correct the following: During a project scan/run, the platform must enforce an absolute processing lock. No other scans can be triggered for any project

the lock is for the specific project the scanner is running, you can run scanners for different projects but not for the same project at the same time

- the scanner_skill_name (String, human-readable identifier for the agentic skill) it is not human readable that is why have the scanner_name, the scanner_skill_name is the literal skill name according to claude docs, the skill folder will have this name and also the frontmatter of the skill, it must be snake_case and somply with claude skills definition rules.

- the scanner_skill_description is what tell claude when to run the skill, what is does and what does not do

- not sure about this, The system updates the structural codebase graph. Simultaneously, ESLint runs and the LLM agent initializes using scripts configured from the /scripts directory.

we should use the scripts used in our db, the files is to allow an agent to also use the worlkflow, or is there is something I am missing?

Here are the corrected sections based on your specific requirements. I've updated the locking mechanism, defined the exact technical specifications for Claude skills, and clarified how files, databases, and the Graph scanner interact during execution.

Revised PRD Adjustments

1. Project-Level Execution Lock (Replaces Section 2, Bullet 1)
   Isolated Project-Level Lock: The execution lock is strictly scoped per project. When a run is active for Project A, the platform enforces an absolute lock only on Project A.

Parallel Execution Allowed: Users or backend triggers can freely run scans on Project B or Project C concurrently.

Rejection Behavior: If a user or an API request attempts to trigger a run on a project that is already processing an active scan, the platform must immediately reject it with a 409 Conflict state or UI blocking warning.

2. LLM Scanner & Claude Skill Alignment (Replaces Section 3.3, Type 2)
   Type 2: LLM Scanners (Agentic Code Evaluators)
   LLM scanners act as definitions for agentic workflows and compile directly into Claude-compatible Skills.

scanner_skill_name (String, Required): The exact, system-level technical identifier for the skill.

Constraint: Must strictly adhere to Claude skill naming rules (snake_case, alphanumeric characters and underscores only, starting with a letter). This name dictates the folder name inside the local workspace and matches the frontmatter identifier.

scanner_skill_description (Text, Required): The semantic description read directly by the LLM. It acts as the orchestration routing guide—explaining to Claude exactly when to execute the skill, what it does, and what its boundaries/limitations are.

Asset Linkage (Files relation): Connects to files marked as /scripts or /resources.

3. Clarifying the File Engine vs. DB Execution
   You hit on an important distinction regarding how the runner works versus how agents leverage the platform. Here is the corrected architecture for how execution handles scripts and data:

The Dual-Purpose Architecture
The files stored in the database are not just static records; they serve two distinct layers:

For the Core Application Runner (Our Platform): When a human triggers an LLM scanner via the UI, the platform's backend fetches the script code and resources directly from the database tables to execute the analysis pipeline using the SDK.

For Autonomous External Agents (The Skill Layer): To allow outside agents to reuse your exact code quality workflows, the platform exports those database files into physical file footprints (/scripts and /resources folders) alongside the generated Claude skill frontmatter. The agent then consumes these folders as an native tool/skill.

Updated Execution Flow (Replaces Section 4, Flow 1)
To ensure data accuracy, the Graph Scanner cannot run simultaneously with linters, because linting or agent execution could modify or evaluate files while the tree is being built. It must run in a sequential pipeline per project:

1
Evaluate Lock & Acquire
Project level scope
Verify no active run is processing for the specific project_id. If free, flag run_status = PROCESSING and lock the target project.

2
Execute Core Graph Sweep
System-level prerequisite
Run the read-only Graph Scanner first. It performs a complete AST sweep of the local codebase path, mapping folders, components, and functions, then flushes the fresh architectural tree directly to the database.

3
Execute Selected Scanners
Database-driven runtime
Execute selected scanners sequentially or in parallel within the project container:

Deterministic: Spin up shell processes using the saved scanner_command.

LLM Tools: Read instructions, scripts, and resources directly out of the application database and feed them into the LLM SDK runtime.

4
Standardize & Persist
Aggregation layer
Collect outputs from all tasks, transform both raw tool strings and LLM reports into the standardized JSON payload structure, update target analytical counts, and release the project lock.

Would you like to refine the specific schemas next?

Draft the Claude Skill frontmatter export template

Review the updated database schema layout

we don't want to queue, we want to reject to avoid abuse of the scanner: Constraint: If Project A is currently executing a run, any attempt to trigger another scan on Project A (via the UI or an automated backend trigger) must be rejected or queued until the active run finishes. However, a scan on Project B can run simultaneously without restriction.

Got it. We will completely strip out queuing to eliminate any vector for resource abuse or memory bloating. If a project is busy, it is an immediate rejection.

Here is the updated requirement lock section to reflect this strict defensive stance:

Updated Concurrency Control Requirement
Project-Scoped Single-Threaded Processing (No Queue)
Instant Rejection Guard: When a run request is received for a given project_id, the system checks if a record exists for that project with a run_status of PROCESSING. If a match is found, the system must immediately reject the request.

Error Interface Behavior:

Backend API: Returns an immediate 409 Conflict HTTP status code with a JSON payload specifying the active run_id and elapsed runtime.

Frontend UI: Disables the execution button dynamically via real-time status polling (WebSockets/SSE). If a race condition bypasses this and hits the endpoint, it presents a clear alert banner: "Project is currently running a scan. Please wait until completion before initiating another."

Total Autonomy Across Projects: This protective constraint is purely isolated to the specific project boundary. A running scan on Project A blocks only Project A. A user or cron trigger can execute a simultaneous scan on Project B or Project C concurrently without any artificial delays.

How should we detail this behavior further?

Design the API response and status check endpoint

Define database state management for run termination

provide me the entire prd with the changes implemented

Product Requirement Document (PRD)
Project CodePulse — Multiverse Code Quality Tracker

1. Executive Summary & Purpose
   CodePulse is a centralized code quality and static analysis platform designed to track, analyze, and quantify code health across multiple repositories over time.

Unlike traditional isolated linting setups, CodePulse bridges the gap between deterministic tooling (linters, type-checkers) and generative AI analysis (agentic LLM reviewers). By logging structural and computational analysis on every run, the platform turns raw terminal outputs and AI observations into structured, historical insights, answering a critical engineering question: Is our code quality getting better or worse over time?

Additionally, the platform maps the architecture of codebases via an automated Abstract Syntax Tree (AST) graph engine to power deep dependency analysis, architectural insights, and autonomous agentic skills.

2. Core Constraints & Concurrency Architecture
   Project-Scoped Single-Threaded Processing (Strict Rejection)
   Isolated Project-Level Lock: The execution lock is strictly scoped per project. When a run is active for Project A, the platform enforces an absolute lock only on Project A.

Parallel Execution Allowed: Users or backend triggers can freely and simultaneously run scans on Project B or Project C concurrently without any cross-project restriction.

Anti-Abuse Instant Rejection Guard: To eliminate resource abuse and memory bloating, the platform does not queue requests. If a run request is received for a given project_id that is already processing an active scan (run_status = PROCESSING), the platform must immediately reject the transaction.

Error Interface Behavior:

Backend API: Returns an immediate 409 Conflict HTTP status code specifying the active run_id and execution details.

Frontend UI: Disables the execution button dynamically via real-time status updates. If a race condition bypasses this block, the UI displays a clear alert banner: "Project is currently running a scan. Please wait until completion before initiating another."

The Standardization Mandate
Every scanner output (whether standard text errors from native binaries like ESLint or markdown summaries generated by an LLM) must be parsed, normalized, and mapped into a uniform JSON schema to ensure smooth UI rendering and numerical trend analysis over time.

The Continuous Shadow Graph
The Graph Scanner is an omnipresent, system-level process. It cannot be disabled, skipped, or customized by users. It executes automatically on every single run to update the structural state of the codebase in the system database.

3. Epics & Feature Requirements
   3.1. Projects Management
   Acts as the central tenant for target codebases located locally on the developer's device (architected to seamlessly support remote repositories in future iterations).

Data Schema
project_id (UUIDv7, Primary Key)

project_name (String, Required)

project_description (Text, Optional)

project_path (String, Local filesystem absolute or relative path)

Audit Attributes: created_at, created_by, modified_at, modified_by, is_disabled, is_deleted (Soft Delete Flag), is_readonly.

Aggregated Analytics: last_run_at, last_run_status (Enum: SUCCESS, FAILED, PROCESSING), project_runs_number (Counter), project_scanners_number (Counter of attached configuration profiles).

Functional Requirements
CRUD Actions: Create, Read, Update, and Soft Delete projects. Soft-deleted projects are hidden from primary dashboards but retained in the DB for historical analytic preservation.

Scan Invocation Engine: Provide a UI configuration panel to launch a run. The user must explicitly select one or multiple specific scanners configured for the project.

3.2. Files Management (Skill Assets)
Manages custom auxiliary execution artifacts (Python/JavaScript scripts, JSON context documents, text prompts) that live inside a project's autonomous skill ecosystem. These records are mapped to LLM scanners to dictate their agentic behaviors.

Data Schema
file_id (UUIDv7, Primary Key)

file_name (String, e.g., security_check.py)

file_description (Text)

file_extension (String, e.g., .py, .json, .txt)

Audit Attributes: created_at, created_by, modified_at, modified_by, is_disabled, is_deleted, is_readonly.

Functional Requirements
File Association Management: Allow developers to register files via the UI. These files physically reside or mirror into /scripts and /resources directories inside the designated skill folder footprint.

M2M Binding: Users can attach multiple files to a single LLM scanner, explicitly defining their operational context (type: script or type: resource).

3.3. Scanners Management
Defines the individual execution engines running against the codebase. The architecture explicitly branches into two core variants alongside a background structural parser.

Data Schema
scanner_id (UUIDv7, Primary Key)

scanner_name (String, Human-readable name used across the application UI)

scanner_description (Text)

Audit Attributes: created_at, created_by, modified_at, modified_by, is_disabled, is_deleted, is_readonly.

Aggregated Analytics: last_run_at, last_run_status, scanner_runs_number.

Type 1: Deterministic Scanners (Command Line Tools)
scanner_command (String, e.g., npx eslint . --format=json, biome check ., oxlint, tsc --noEmit)

Execution Behavior: Runs native binary commands on the host system shell, captures stdout/stderr, and routes it to the ingestion parser.

Type 2: LLM Scanners (Agentic Code Evaluators & Claude Skills)
LLM scanners act as definitions for agentic workflows and compile directly into Claude-compatible Skills.

scanner_skill_name (String, Required): The exact, system-level technical identifier for the skill.

Constraint: Must strictly adhere to Claude skill naming rules (snake_case, alphanumeric characters and underscores only, starting with a letter). This name dictates the physical folder name inside the local workspace and matches the frontmatter identifier.

scanner_skill_description (Text, Required): The semantic description read directly by the LLM. It acts as the orchestration routing guide—explaining to Claude exactly when to execute the skill, what it does, and what its boundaries/limitations are.

Asset Linkage (Files relation): Connects to files marked as /scripts or /resources.

Dual-Purpose Execution Architecture (Files vs. DB)
The platform manages these scripts and resource files to serve two separate integration targets:

For the Core Application Runner (Our Platform): When a human triggers an LLM scanner via the UI, the platform's backend fetches the script code and resources directly from the database tables to execute the analysis pipeline using our SDK.

For Autonomous External Agents (The Skill Layer): To allow outside agents to leverage our platform, the system can export those database files into physical file footprints (/scripts and /resources folders) alongside the generated Claude skill frontmatter using the scanner_skill_name directory structure.

Type 3: The System Graph Scanner (Read-Only)
Implicit Execution: Hidden from standard selection lists; triggered automatically alongside any standard run.

Mechanism: Executes a structural AST parser (e.g., via Oxlint, SWC, or Tree-sitter) to transform the source code into a highly granular graph layout.

Graph Depth: Must capture directory layouts, component/file nodes, functions, variables, down to function argument signatures.

Query Capabilities: Must be architected to resolve hierarchical queries quickly, such as "How many child leaves/functions exist inside src/components/Button?"

3.4. Scans & Run Life-Cycle Management
Tracks execution metadata, processing states, and technical code health metrics across three structured layers: Run (Master Orchestrator), Scan (Per-Scanner Job), and Scan Details (Outputs).

+-------------------------------------------------------------+
| RUN (Master Level) |
| Tracks overall execution time, project lock, total files |
+-------------------------------------------------------------+
|
v
+-------------------------------------------------------------+
| SCAN (Job Level) |
| Tracks individual Scanner lifecycles (e.g., Biome, LLM) |
+-------------------------------------------------------------+
|
v
+-------------------------------------------------------------+
| SCAN DETAILS (Data Level) |
| Stores exact outputs, error tokens, metrics & raw results |
+-------------------------------------------------------------+
Layer 1: Run (Master Orchestrator)
Tracks the lifecycle of an overall execution unit.

run_id (UUIDv7, Primary Key)

project_id (Foreign Key)

run_executed_at / run_started_at / run_finished_at (Timestamps)

run_executed_by (User ID string)

run_status (Enum: PROCESSING, COMPLETED, FAILED)

Metrics Columns: run_files_number (Total file count at time of run), run_scanners_executed (Integer).

Audit Attributes: created_at, created_by, modified_at, modified_by, is_deleted, is_readonly.

Layer 2: Scan (Individual Job Instance)
Tracks the isolated execution of a specific scanner inside the wider Run context.

run_id (Foreign Key, Compound PK component)

scanner_id (Foreign Key, Compound PK component)

scan_status (Enum: PENDING, RUNNING, SUCCESS, FAIL)

scan_started_at / scan_finished_at (Timestamps)

Metrics Block (Dynamically Structured per Scanner Engine):

Deterministic Example: { "errors": 12, "warnings": 45, "duration_ms": 1200 }

LLM Example: { "tokens_consumed": 4200, "critical_flaws_found": 2, "adherence_score": 88 }

Layer 3: Scan Details (The Output Store)
run_id (Foreign Key)

scanner_id (Foreign Key)

outputs (JSONB / Structured Data Object)

Must capture raw string output logs for debugging purposes.

Must store the standardized format mapping (normalized array of findings containing line numbers, severity level, affected code snippets, and textual summaries).

4. Operational Execution Lifecycle
   To prevent race conditions between the dynamic AST graph generation and code evaluation tools, executions run within a strict sequential pipeline per project:

1
Evaluate Lock & Acquire
Project-level scope guard
Verify no active run is processing for the specific project_id. If free, instantly set run_status = PROCESSING and lock the target project. If busy, reject the request immediately with a 409 status code.

2
Execute Core Graph Sweep
System-level prerequisite
Run the read-only Graph Scanner first. It performs a complete AST sweep of the local codebase path, mapping folders, components, and functions, then flushes the fresh architectural tree directly to the database.

3
Execute Selected Scanners
Database-driven runtime
Execute selected scanners sequentially or in parallel within the project container:

Deterministic: Spin up shell processes using the saved scanner_command.

LLM Tools: Read instructions, scripts, and resources directly out of the application database and feed them into the LLM SDK runtime.

4
Standardize & Persist
Aggregation layer
Collect outputs from all tasks, transform both raw tool strings and LLM reports into the standardized JSON payload structure, update target analytical counts, and release the project lock.

5. User Personas & Core User Flows
   Developer Flow: Run and Remediate
   Navigate to an active Project via the UI dashboard.

Select "Trigger Scan" and multi-select Biome (Deterministic) and Security Reviewer (LLM Skill).

The system enforces the project-level lock.

The system updates the structural codebase graph first. Immediately following, Biome executes and the LLM agent initializes using the script payloads retrieved from the database.

Once complete, the system releases the lock, renders visual delta lines showing whether error metrics dropped compared to the previous run, and updates the metrics dashboard.

Product Owner Flow: Health Dashboard
Open the high-level analytics viewport.

Filter dashboards across target production projects.

Review graphs showing code changes over time, noting if code quality numbers are declining or improving across release windows.

6. Non-Functional Requirements & Security Metrics
   Performance: Deterministic scanners should stream output lines instantly to minimize process lock durations on large repositories.

Process Isolation: LLM scanner agents must run in secure sandboxed environments so execution of code retrieved from the database cannot cause unintended systemic side-effects on the developer's host machine.

Database Scaling: Because the system-level Graph Scanner maps codebases down to function arguments, the graph database tables must be heavily indexed (utilizing recursive CTE optimization or specialized hierarchical indexing schemes) to ensure fast lookup response times when answering parent-child structural queries.

Where should we take the technical specifications of CodePulse next?

Design the Database Schema Design

Define the Standarized Output JSON Schema

let's clarify that when running the scans, we should run them in parallel when possible.

add that clarification and generate a md file that i can dosnload

Your Markdown file is ready
MD icon
codepulse_prd
MD
Open

I have updated the PRD to clearly reflect that all selected user scanners (Deterministic and LLM variants) run in parallel as a concurrent execution pool immediately after the initial structural Graph Scanner finishes its prerequisite snapshot.

The complete file containing all criteria, project-scoped rejection constraints, asset rules, and parallel worker logic has been compiled and is ready for download.

we have to also run the graph in parallel, why would we block ?? While the Graph Scanner behaves as a structural prerequisite that runs blocking at the start,

Running the Graph Scanner in parallel with the other scanners is completely valid—and highly efficient—provided we clarify one structural rule: The other scanners will read from the file system, while the Graph Scanner reads from the file system to write the architecture to the database.

Since all of these actions are read-only operations regarding the source code files themselves, there is zero risk of file corruption or race conditions on the local disk.

Here is why running the graph in parallel works perfectly, followed by the corrected execution flow block for your PRD:

Zero File IO Blocks: Linters (like Biome/ESLint) and LLM agents read the source files to find violations. The Graph Scanner reads the source files to build the AST tree. They do not cross paths or modify files, meaning they can run simultaneously without blocking each other.

Database Isolation: The Graph Scanner writes structural nodes (folders, functions) to its own relational graph tables, while the other scanners write individual findings into the scan_details JSON payloads. Their database writes do not conflict.

Updated Phase-by-Phase Orchestration Flow
Replace Section 4 (Operational Execution Lifecycle & Parallelization) in your document with this fully parallelized flow:

1
Evaluate Lock & Acquire
Project-level scope guard
Verify no active run is processing for the specific project_id. If free, instantly set run_status = PROCESSING and lock the target project. If busy, reject the request immediately with a 409 status code.

2
Execute Combined Parallel Pool
All worker pools execute at once
The platform spins up a single execution layer, launching all tasks concurrently to achieve the fastest possible throughput:

The System Graph Worker: Concurrently runs an AST sweep of the project path, parsing dependencies down to function arguments, and flushes the structural tree directly into the database.

Deterministic Workers: Launch background shell sub-processes asynchronously using the saved scanner_command configurations.

LLM Engine Workers: Concurrently dispatch requests to the LLM SDK runtime, streaming instructions, scripts, and resources directly out of the application database tables.

3
Join, Standarize & Persist
Aggregation layer
Wait for all parallel workers (Graph, Deterministic, and LLM) to completely resolve or hit their timeout thresholds. Collect results, map all tool outputs into the standardized JSON schema layout, update project analytics counters, and release the project lock.

Would you like to generate the updated markdown file with this final shift to full parallelization?

Generate and rewrite the complete parallelized MD file

we also have to implement a nice mechanism to notify the users what is going on, please update the document and generate the new md file

Python
prd_content = """# Product Requirement Document (PRD)

## Project CodePulse — Multiverse Code Quality Tracker

## 1. Executive Summary & Purpose

CodePulse is a centralized code quality and static analysis platform designed to track, analyze, and quantify code health across multiple repositories over time.

Unlike traditional isolated linting setups, CodePulse bridges the gap between **deterministic tooling** (linters, type-checkers) and **generative AI analysis** (agentic LLM reviewers). By logging structural and computational analysis on every run, the platform turns raw terminal outputs and AI observations into structured, historical insights, answering a critical engineering question: _Is our code quality getting better or worse over time?_

Additionally, the platform maps the architecture of codebases via an automated Abstract Syntax Tree (AST) graph engine to power deep dependency analysis, architectural insights, and autonomous agentic skills.

---

## 2. Core Constraints & Concurrency Architecture

### Project-Scoped Single-Threaded Processing (Strict Rejection)

- **Isolated Project-Level Lock:** The execution lock is strictly scoped per project. When a run is active for `Project A`, the platform enforces an absolute lock **only** on `Project A`.
- **Parallel Execution Allowed:** Users or backend triggers can freely and simultaneously run scans on `Project B` or `Project C` concurrently without any cross-project restriction.
- **Anti-Abuse Instant Rejection Guard:** To eliminate resource abuse and memory bloating, **the platform does not queue requests**. If a run request is received for a given `project_id` that is already processing an active scan (`run_status = PROCESSING`), the platform must **immediately reject** the transaction.
- **Error Interface Behavior:**
  - **Backend API:** Returns an immediate `409 Conflict` HTTP status code specifying the active `run_id` and execution details.
  - **Frontend UI:** Disables the execution button dynamically via real-time status updates. If a race condition bypasses this block, the UI displays a clear alert banner: _"Project is currently running a scan. Please wait until completion before initiating another."_

### The Standardization Mandate

Every scanner output (whether standard text errors from native binaries like ESLint or markdown summaries generated by an LLM) must be parsed, normalized, and mapped into a uniform JSON schema to ensure smooth UI rendering and numerical trend analysis over time.

### The Continuous Shadow Graph

The Graph Scanner is an omnipresent, system-level process. It cannot be disabled, skipped, or customized by users. It executes automatically on every single run to update the structural state of the codebase in the system database.

---

## 3. Epics & Feature Requirements

### 3.1. Projects Management

Acts as the central tenant for target codebases located locally on the developer's device (architected to seamlessly support remote repositories in future iterations).

#### Data Schema

- `project_id` (UUIDv7, Primary Key)
- `project_name` (String, Required)
- `project_description` (Text, Optional)
- `project_path` (String, Local filesystem absolute or relative path)
- **Audit Attributes:** `created_at`, `created_by`, `modified_at`, `modified_by`, `is_disabled`, `is_deleted` (Soft Delete Flag), `is_readonly`.
- **Aggregated Analytics:** `last_run_at`, `last_run_status` (Enum: `SUCCESS`, `FAILED`, `PROCESSING`), `project_runs_number` (Counter), `project_scanners_number` (Counter of attached configuration profiles).

#### Functional Requirements

- **CRUD Actions:** Create, Read, Update, and Soft Delete projects. Soft-deleted projects are hidden from primary dashboards but retained in the DB for historical analytic preservation.
- **Scan Invocation Engine:** Provide a UI configuration panel to launch a run. The user must explicitly select one or multiple specific scanners configured for the project.

---

### 3.2. Files Management (Skill Assets)

Manages custom auxiliary execution artifacts (Python/JavaScript scripts, JSON context documents, text prompts) that live inside a project's autonomous skill ecosystem. These records are mapped to LLM scanners to dictate their agentic behaviors.

#### Data Schema

- `file_id` (UUIDv7, Primary Key)
- `file_name` (String, e.g., `security_check.py`)
- `file_description` (Text)
- `file_extension` (String, e.g., `.py`, `.json`, `.txt`)
- **Audit Attributes:** `created_at`, `created_by`, `modified_at`, `modified_by`, `is_disabled`, `is_deleted`, `is_readonly`.

#### Functional Requirements

- **File Association Management:** Allow developers to register files via the UI. These files physically reside or mirror into `/scripts` and `/resources` directories inside the designated skill folder footprint.
- **M2M Binding:** Users can attach multiple files to a single LLM scanner, explicitly defining their operational context (`type: script` or `type: resource`).

---

### 3.3. Scanners Management

Defines the individual execution engines running against the codebase. The architecture explicitly branches into two core variants alongside a background structural parser.

#### Data Schema

- `scanner_id` (UUIDv7, Primary Key)
- `scanner_name` (String, Human-readable name used across the application UI)
- `scanner_description` (Text)
- **Audit Attributes:** `created_at`, `created_by`, `modified_at`, `modified_by`, `is_disabled`, `is_deleted`, `is_readonly`.
- **Aggregated Analytics:** `last_run_at`, `last_run_status`, `scanner_runs_number`.

#### Type 1: Deterministic Scanners (Command Line Tools)

- `scanner_command` (String, e.g., `npx eslint . --format=json`, `biome check .`, `oxlint`, `tsc --noEmit`)
- **Execution Behavior:** Runs native binary commands on the host system shell, captures stdout/stderr, and routes it to the ingestion parser.

#### Type 2: LLM Scanners (Agentic Code Evaluators & Claude Skills)

LLM scanners act as definitions for agentic workflows and compile directly into Claude-compatible Skills.

- `scanner_skill_name` (String, Required): The exact, system-level technical identifier for the skill.
  - _Constraint:_ Must strictly adhere to Claude skill naming rules (**snake_case**, alphanumeric characters and underscores only, starting with a letter). This name dictates the physical folder name inside the local workspace and matches the frontmatter identifier.
- `scanner_skill_description` (Text, Required): The semantic description read directly by the LLM. It acts as the orchestration routing guide—explaining to Claude exactly _when_ to execute the skill, what it _does_, and what its _boundaries/limitations_ are.
- **Asset Linkage (`Files` relation):** Connects to files marked as `/scripts` or `/resources`.

#### Dual-Purpose Execution Architecture (Files vs. DB)

The platform manages these scripts and resource files to serve two separate integration targets:

1.  **For the Core Application Runner (Our Platform):** When a human triggers an LLM scanner via the UI, the platform's backend fetches the script code and resources _directly from the database tables_ to execute the analysis pipeline using our SDK.
2.  **For Autonomous External Agents (The Skill Layer):** To allow outside agents to leverage our platform, the system can **export** those database files into physical file footprints (`/scripts` and `/resources` folders) alongside the generated Claude skill frontmatter using the `scanner_skill_name` directory structure.

#### Type 3: The System Graph Scanner (Read-Only)

- **Implicit Execution:** Hidden from standard selection lists; triggered automatically alongside any standard run.
- **Mechanism:** Executes a structural AST parser (e.g., via Oxlint, SWC, or Tree-sitter) to transform the source code into a highly granular graph layout.
- **Graph Depth:** Must capture directory layouts, component/file nodes, functions, variables, down to function argument signatures.
- **Query Capabilities:** Must be architected to resolve hierarchical queries quickly, such as "How many child leaves/functions exist inside `src/components/Button`?"

---

## 4. Operational Execution Lifecycle & Parallelization

To maximize performance and cut execution times down to the absolute minimum, the orchestration layer features high concurrent processing. Because all scanner routines are read-only operations against the local codebase directory, **the structural Graph Scanner, all Deterministic Scanners, and all LLM Scanners run in parallel simultaneously**.

### Phase-by-Phase Orchestration Flow:

1. **Evaluate Lock & Acquire (Blocking):** Verify no active run is processing for the specific `project_id`. If free, instantly set `run_status = PROCESSING` and lock the target project. If busy, reject the request immediately with a 409 status code.
2. **Execute Combined Parallel Pool (Concurrently):** The platform spins up a single execution layer, launching **all** tasks concurrently to achieve maximum throughput:
   - **The System Graph Worker:** Runs an AST sweep of the project path, parsing dependencies down to function arguments, and flushes the structural tree directly into the database.
   - **Deterministic Workers:** Launch background shell sub-processes asynchronously using the saved `scanner_command` configurations.
   - **LLM Engine Workers:** Concurrently dispatch requests to the LLM SDK runtime, streaming instructions, scripts, and resources directly out of the application database tables.
3. **Aggregation layer (Join & Persist):** Wait for all parallel workers (Graph, Deterministic, and LLM) to completely resolve or hit their timeout thresholds. Collect results, map all tool outputs into the standardized JSON schema layout, update project analytics counters, and release the project lock.

---

## 5. Live Progress Notification Engine

To keep developers and product owners informed about ongoing operations, the platform implements a decoupled, event-driven notification mechanism streaming state changes from the backend workers straight to the front-end user experience.

### Technical Architecture

- **Transport Mechanism:** Server-Sent Events (SSE) or WebSockets channel scoped by `project_id` (e.g., `/api/projects/{project_id}/live-status`).
- **Event Payload Format:** Uniform JSON messaging tracking worker lifecycle steps:
  ```json
  {
    "run_id": "0190b395-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "project_id": "0190b395-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "timestamp": "2026-07-11T20:40:00Z",
    "event_type": "SCANNER_STARTED | SCANNER_PROGRESS | SCANNER_COMPLETED | SCANNER_FAILED | RUN_FINALIZED",
    "scanner_id": "0190b395-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "scanner_type": "GRAPH | DETERMINISTIC | LLM",
    "message": "Step description or stdout line snippet",
    "percentage_complete": 45
  }
  ```

### User Interface Elements

- **Project Processing Banner:** Appears globally when navigating a locked project, displaying a running master timer alongside active progress bars for each parallel task.
- **Live Console Log Stepper:** A collapsible drawer within the project dashboard showcasing real-time text logs.
  - Shows structural building updates from the **Graph Scanner** (e.g., `[Graph] Parsed 432 nodes...`).
  - Streams standard output stdout snippets from active **Deterministic commands** (e.g., `[ESLint] Checking src/utils...`).
  - Displays agent thoughts or tracking steps from **LLM Scanners** (e.g., `[LLM Security Agent] Evaluating buffer allocations...`).
- **Push Notifications:** Optional webhooks or native desktop system toasts deployed when a run changes status to `COMPLETED` or `FAILED`, containing quick stats on the run (e.g., _"Scan Complete: 12 errors fixed, 2 security alerts identified"_).

---

## 6. User Personas & Core User Flows

### Developer Flow: Run and Remediate

1. Navigate to an active Project via the UI dashboard.
2. Select **"Trigger Scan"** and multi-select **Biome** (Deterministic) and **Security Reviewer** (LLM Skill).
3. The system enforces the project-level lock.
4. The system launches the structural codebase graph scanner, Biome, and the Security Reviewer LLM in parallel to maximize throughput.
5. The Live Progress Notification Engine displays interactive progress wheels and log output streams across all three running engines concurrently.
6. Once complete, the notifications flash green, the system releases the lock, renders visual delta lines showing whether error metrics dropped compared to the previous run, and updates the metrics dashboard.

### Product Owner Flow: Health Dashboard

1. Open the high-level analytics viewport.
2. Filter dashboards across target production projects.
3. Review graphs showing code changes over time, noting if code quality numbers are declining or improving across release windows.

---

## 7. Non-Functional Requirements & Security Metrics

- **Performance:** Deterministic scanners should stream output lines instantly to minimize process lock durations on large repositories.
- **Process Isolation:** LLM scanner agents must run in secure sandboxed environments so execution of code retrieved from the database cannot cause unintended systemic side-effects on the developer's host machine.
- **Database Scaling:** Because the system-level Graph Scanner maps codebases down to function arguments, the graph database tables must be heavily indexed (utilizing recursive CTE optimization or specialized hierarchical indexing schemes) to ensure fast lookup response times when answering parent-child structural queries.
  """

with open("codepulse_prd.md", "w") as f:
f.write(prd_content.strip())

Your file has been updated and generated successfully.
MD icon
codepulse_prd
MD
Open

What's New:
Fully Parallelized Flow (Section 4): The Graph Scanner now spins up concurrently alongside the deterministic binaries and LLM workers inside a shared execution pool, eliminating unnecessary blocking steps.

Live Progress Notification Engine (Section 5): Added a brand-new feature section defining an event-driven status architecture using Server-Sent Events (SSE) / WebSockets to stream uniform progress updates, live console log segments, and execution percentages directly to the user interface.

Gemini is AI and can make mistakes, including about people. Your privacy & GeminiOpens in a new window

# Product Requirement Document (PRD)

## Project CodePulse — Multiverse Code Quality Tracker

## 1. Executive Summary & Purpose

CodePulse is a centralized code quality and static analysis platform designed to track, analyze, and quantify code health across multiple repositories over time.

Unlike traditional isolated linting setups, CodePulse bridges the gap between **deterministic tooling** (linters, type-checkers) and **generative AI analysis** (agentic LLM reviewers). By logging structural and computational analysis on every run, the platform turns raw terminal outputs and AI observations into structured, historical insights, answering a critical engineering question: _Is our code quality getting better or worse over time?_

Additionally, the platform maps the architecture of codebases via an automated Abstract Syntax Tree (AST) graph engine to power deep dependency analysis, architectural insights, and autonomous agentic skills.

---

## 2. Core Constraints & Concurrency Architecture

### Project-Scoped Single-Threaded Processing (Strict Rejection)

- **Isolated Project-Level Lock:** The execution lock is strictly scoped per project. When a run is active for `Project A`, the platform enforces an absolute lock **only** on `Project A`.
- **Parallel Execution Allowed:** Users or backend triggers can freely and simultaneously run scans on `Project B` or `Project C` concurrently without any cross-project restriction.
- **Anti-Abuse Instant Rejection Guard:** To eliminate resource abuse and memory bloating, **the platform does not queue requests**. If a run request is received for a given `project_id` that is already processing an active scan (`run_status = PROCESSING`), the platform must **immediately reject** the transaction.
- **Error Interface Behavior:**
  - **Backend API:** Returns an immediate `409 Conflict` HTTP status code specifying the active `run_id` and execution details.
  - **Frontend UI:** Disables the execution button dynamically via real-time status updates. If a race condition bypasses this block, the UI displays a clear alert banner: _"Project is currently running a scan. Please wait until completion before initiating another."_

### The Standardization Mandate

Every scanner output (whether standard text errors from native binaries like ESLint or markdown summaries generated by an LLM) must be parsed, normalized, and mapped into a uniform JSON schema to ensure smooth UI rendering and numerical trend analysis over time.

### The Continuous Shadow Graph

The Graph Scanner is an omnipresent, system-level process. It cannot be disabled, skipped, or customized by users. It executes automatically on every single run to update the structural state of the codebase in the system database.

---

## 3. Epics & Feature Requirements

### 3.1. Projects Management

Acts as the central tenant for target codebases located locally on the developer's device (architected to seamlessly support remote repositories in future iterations).

#### Data Schema

- `project_id` (UUIDv7, Primary Key)
- `project_name` (String, Required)
- `project_description` (Text, Optional)
- `project_path` (String, Local filesystem absolute or relative path)
- **Audit Attributes:** `created_at`, `created_by`, `modified_at`, `modified_by`, `is_disabled`, `is_deleted` (Soft Delete Flag), `is_readonly`.
- **Aggregated Analytics:** `last_run_at`, `last_run_status` (Enum: `SUCCESS`, `FAILED`, `PROCESSING`), `project_runs_number` (Counter), `project_scanners_number` (Counter of attached configuration profiles).

#### Functional Requirements

- **CRUD Actions:** Create, Read, Update, and Soft Delete projects. Soft-deleted projects are hidden from primary dashboards but retained in the DB for historical analytic preservation.
- **Scan Invocation Engine:** Provide a UI configuration panel to launch a run. The user must explicitly select one or multiple specific scanners configured for the project.

---

### 3.2. Files Management (Skill Assets)

Manages custom auxiliary execution artifacts (Python/JavaScript scripts, JSON context documents, text prompts) that live inside a project's autonomous skill ecosystem. These records are mapped to LLM scanners to dictate their agentic behaviors.

#### Data Schema

- `file_id` (UUIDv7, Primary Key)
- `file_name` (String, e.g., `security_check.py`)
- `file_description` (Text)
- `file_extension` (String, e.g., `.py`, `.json`, `.txt`)
- **Audit Attributes:** `created_at`, `created_by`, `modified_at`, `modified_by`, `is_disabled`, `is_deleted`, `is_readonly`.

#### Functional Requirements

- **File Association Management:** Allow developers to register files via the UI. These files physically reside or mirror into `/scripts` and `/resources` directories inside the designated skill folder footprint.
- **M2M Binding:** Users can attach multiple files to a single LLM scanner, explicitly defining their operational context (`type: script` or `type: resource`).

---

### 3.3. Scanners Management

Defines the individual execution engines running against the codebase. The architecture explicitly branches into two core variants alongside a background structural parser.

#### Data Schema

- `scanner_id` (UUIDv7, Primary Key)
- `scanner_name` (String, Human-readable name used across the application UI)
- `scanner_description` (Text)
- **Audit Attributes:** `created_at`, `created_by`, `modified_at`, `modified_by`, `is_disabled`, `is_deleted`, `is_readonly`.
- **Aggregated Analytics:** `last_run_at`, `last_run_status`, `scanner_runs_number`.

#### Type 1: Deterministic Scanners (Command Line Tools)

- `scanner_command` (String, e.g., `npx eslint . --format=json`, `biome check .`, `oxlint`, `tsc --noEmit`)
- **Execution Behavior:** Runs native binary commands on the host system shell, captures stdout/stderr, and routes it to the ingestion parser.

#### Type 2: LLM Scanners (Agentic Code Evaluators & Claude Skills)

LLM scanners act as definitions for agentic workflows and compile directly into Claude-compatible Skills.

- `scanner_skill_name` (String, Required): The exact, system-level technical identifier for the skill.
  - _Constraint:_ Must strictly adhere to Claude skill naming rules (**snake_case**, alphanumeric characters and underscores only, starting with a letter). This name dictates the physical folder name inside the local workspace and matches the frontmatter identifier.
- `scanner_skill_description` (Text, Required): The semantic description read directly by the LLM. It acts as the orchestration routing guide—explaining to Claude exactly _when_ to execute the skill, what it _does_, and what its _boundaries/limitations_ are.
- **Asset Linkage (`Files` relation):** Connects to files marked as `/scripts` or `/resources`.

#### Dual-Purpose Execution Architecture (Files vs. DB)

The platform manages these scripts and resource files to serve two separate integration targets:

1.  **For the Core Application Runner (Our Platform):** When a human triggers an LLM scanner via the UI, the platform's backend fetches the script code and resources _directly from the database tables_ to execute the analysis pipeline using our SDK.
2.  **For Autonomous External Agents (The Skill Layer):** To allow outside agents to leverage our platform, the system can **export** those database files into physical file footprints (`/scripts` and `/resources` folders) alongside the generated Claude skill frontmatter using the `scanner_skill_name` directory structure.

#### Type 3: The System Graph Scanner (Read-Only)

- **Implicit Execution:** Hidden from standard selection lists; triggered automatically alongside any standard run.
- **Mechanism:** Executes a structural AST parser (e.g., via Oxlint, SWC, or Tree-sitter) to transform the source code into a highly granular graph layout.
- **Graph Depth:** Must capture directory layouts, component/file nodes, functions, variables, down to function argument signatures.
- **Query Capabilities:** Must be architected to resolve hierarchical queries quickly, such as "How many child leaves/functions exist inside `src/components/Button`?"

---

## 4. Operational Execution Lifecycle & Parallelization

To maximize performance and cut execution times down to the absolute minimum, the orchestration layer features high concurrent processing. Because all scanner routines are read-only operations against the local codebase directory, **the structural Graph Scanner, all Deterministic Scanners, and all LLM Scanners run in parallel simultaneously**.

### Phase-by-Phase Orchestration Flow:

1. **Evaluate Lock & Acquire (Blocking):** Verify no active run is processing for the specific `project_id`. If free, instantly set `run_status = PROCESSING` and lock the target project. If busy, reject the request immediately with a 409 status code.
2. **Execute Combined Parallel Pool (Concurrently):** The platform spins up a single execution layer, launching **all** tasks concurrently to achieve maximum throughput:
   - **The System Graph Worker:** Runs an AST sweep of the project path, parsing dependencies down to function arguments, and flushes the structural tree directly into the database.
   - **Deterministic Workers:** Launch background shell sub-processes asynchronously using the saved `scanner_command` configurations.
   - **LLM Engine Workers:** Concurrently dispatch requests to the LLM SDK runtime, streaming instructions, scripts, and resources directly out of the application database tables.
3. **Aggregation layer (Join & Persist):** Wait for all parallel workers (Graph, Deterministic, and LLM) to completely resolve or hit their timeout thresholds. Collect results, map all tool outputs into the standardized JSON schema layout, update project analytics counters, and release the project lock.

---

## 5. Live Progress Notification Engine

To keep developers and product owners informed about ongoing operations, the platform implements a decoupled, event-driven notification mechanism streaming state changes from the backend workers straight to the front-end user experience.

### Technical Architecture

- **Transport Mechanism:** Server-Sent Events (SSE) or WebSockets channel scoped by `project_id` (e.g., `/api/projects/{project_id}/live-status`).
- **Event Payload Format:** Uniform JSON messaging tracking worker lifecycle steps:
  ```json
  {
    "run_id": "0190b395-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "project_id": "0190b395-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "timestamp": "2026-07-11T20:40:00Z",
    "event_type": "SCANNER_STARTED | SCANNER_PROGRESS | SCANNER_COMPLETED | SCANNER_FAILED | RUN_FINALIZED",
    "scanner_id": "0190b395-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "scanner_type": "GRAPH | DETERMINISTIC | LLM",
    "message": "Step description or stdout line snippet",
    "percentage_complete": 45
  }
  ```

### User Interface Elements

- **Project Processing Banner:** Appears globally when navigating a locked project, displaying a running master timer alongside active progress bars for each parallel task.
- **Live Console Log Stepper:** A collapsible drawer within the project dashboard showcasing real-time text logs.
  - Shows structural building updates from the **Graph Scanner** (e.g., `[Graph] Parsed 432 nodes...`).
  - Streams standard output stdout snippets from active **Deterministic commands** (e.g., `[ESLint] Checking src/utils...`).
  - Displays agent thoughts or tracking steps from **LLM Scanners** (e.g., `[LLM Security Agent] Evaluating buffer allocations...`).
- **Push Notifications:** Optional webhooks or native desktop system toasts deployed when a run changes status to `COMPLETED` or `FAILED`, containing quick stats on the run (e.g., _"Scan Complete: 12 errors fixed, 2 security alerts identified"_).

---

## 6. User Personas & Core User Flows

### Developer Flow: Run and Remediate

1. Navigate to an active Project via the UI dashboard.
2. Select **"Trigger Scan"** and multi-select **Biome** (Deterministic) and **Security Reviewer** (LLM Skill).
3. The system enforces the project-level lock.
4. The system launches the structural codebase graph scanner, Biome, and the Security Reviewer LLM in parallel to maximize throughput.
5. The Live Progress Notification Engine displays interactive progress wheels and log output streams across all three running engines concurrently.
6. Once complete, the notifications flash green, the system releases the lock, renders visual delta lines showing whether error metrics dropped compared to the previous run, and updates the metrics dashboard.

### Product Owner Flow: Health Dashboard

1. Open the high-level analytics viewport.
2. Filter dashboards across target production projects.
3. Review graphs showing code changes over time, noting if code quality numbers are declining or improving across release windows.

---

## 7. Non-Functional Requirements & Security Metrics

- **Performance:** Deterministic scanners should stream output lines instantly to minimize process lock durations on large repositories.
- **Process Isolation:** LLM scanner agents must run in secure sandboxed environments so execution of code retrieved from the database cannot cause unintended systemic side-effects on the developer's host machine.
- **Database Scaling:** Because the system-level Graph Scanner maps codebases down to function arguments, the graph database tables must be heavily indexed (utilizing recursive CTE optimization or specialized hierarchical indexing schemes) to ensure fast lookup response times when answering parent-child structural queries.
  codepulse_prd.md
  Displaying codepulse_prd.md.
