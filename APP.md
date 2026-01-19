# qr-api — Application Guide (APP.md)

This document is the **single source of truth** for architecture, conventions, and guardrails for the `qr-api` backend project.

> **Cursor / Agent instruction:** Read this file first. Follow it as the primary guidance for planning and code changes. If a rule conflicts with existing code, prefer existing code and report the conflict.

---

## 1) Project Main Purpose

`qr-api` is the NodeJS/RestJS backend API of the `qr` (quick-reports) project, which we developed to enable organizations to easily meet their reporting needs. Basically, it loads the **report definition**, stored in JSON format in the /reports folder, using the reportId parameter sent from the frontend (qr-app). Then, it executes the SQL query within the report definition on the connection specified as `datasource` within the report definition, and returns the result to the front end matching the output in the report definition.

The backend also handles the definition and authorization of users who will log into the system. 

⸻

## 2) Authentication

	• API authenticates and returns a JWT access token
		1. The front-end calls the `POST /auth/login` request.
		2. The API performs authentication and returns a JWT access token.
		3. The front-end calls the reporting endpoints as follows:
			- JWT in `Authorization: Bearer <token>`
	• Authenticated user access control (JwtAuthGuard) will be applied to all rest endpoints except /auth/login.
⸻

## 3) Database Configuration

	• The project's root folder contains two different dbconfig.json configuration files:
		1. **app-dbconfig.json**: This is the configuration file for the application's own database. It belongs to the database containing the application's own tables, such as user definitions, application menu, and authorization rules. This database, named `qr`, runs on a MySQL server.
		2. **report-dbconfig.json**: This is the configuration file for the customer database(s). Reports defined by users will run on these databases. Currently, only Oracle and SQL Server database servers will be supported.

	• All database connections (application database or customer database(s) to be used for reporting) will be provided through the connection pool. **Database performance will always be considered.**

⸻

## 4) SQL Execution Rules

	•	SQL must be parameterized (no string concatenation).
	•	Only read-only queries are allowed (initially): SELECT only.
	•	Block: INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, MERGE, CALL, etc.
	•	Block multiple statements (e.g., ; usage).
	•	Datasource must be selected from an allowed list (server-side - report-dbconfig.json).
	•	Column metadata is optional and used only for UI hints; backend must not rely on it for correctness.
	•	Permissions must be enforced server-side, not trusted from client input.

 	The goal is a robust, secure, and extensible reporting backend with **strict safety controls** for SQL execution.

⸻

## 5) Architecture & Module Structure
	NestJS Module-First Organization (required)

	We follow NestJS docs style: each feature is a module containing all related files.

	✅ Allowed:
		•	src/auth/auth.module.ts
		•	src/auth/auth.controller.ts
		•	src/auth/auth.service.ts
		•	src/auth/guards/jwt-auth.guard.ts
		•	src/auth/strategies/jwt.strategy.ts
		•	src/auth/dto/login.request.dto.ts

	❌ Not allowed:
		•	Global folders like controllers/, services/, guards/, pipes/ at the project root level.

⸻

## 6) Coding Standards (Strict)

	6.1 Single Responsibility
		•	No “mega classes” (hundreds/thousands of lines).
		•	Break into small services/helpers when responsibility grows.
		•	Prefer composition over bloated classes.

	6.2 Interfaces & Types (Preferred)
		•	Model domain and contracts using interface / type.
		•	DTOs for inbound/outbound request/response contracts.
		•	Avoid any. Use unknown + narrowing when needed.

	6.3 Naming Conventions
		•	Variables: camelCase
		•	Classes: PascalCase
		•	Files: kebab-case (recommended), or NestJS default patterns consistently
		•	Identifiers: English only
		•	Comments: English only

	6.4 Comments
		•	Keep comments concise and meaningful.
		•	Use comments to explain why, not what (when possible).

⸻

## 7) Error Handling & Response Shape
	•	Use NestJS exceptions and consistent error format.
	•	Include:
	•	a human-readable message
	•	a stable error code (recommended)
	•	optional details for debugging (avoid leaking secrets)
	•   All REST endpoints, except for /auth/login, will return this JSON format to the frontend as response;
		{
			status: 200, // Or whatever the response code is
			message: "Completed successfully", // or error message, if occurs
			data: [] 	// if the service will return data, map the resulting rows into a JSON payload consumable by the frontend
		}

⸻

## 8) Cursor / Agent Working Agreement (Project Rules)

	When you (the agent) work on this repo:
		1.	Read APP.md first and restate the relevant constraints for the task.
		2.	Keep changes minimal and localized.
		3.	Do not introduce new dependencies unless explicitly requested.
		4.	Do not change public APIs without explicit approval.
		5.	When implementing a feature:
		6	create/extend a feature module
		7	keep controllers thin
		8	keep services focused
		9	split responsibilities into small units
		10.	Always write English identifiers and English comments.

⸻

## 9) Tech Stack

	• Runtime: Node.js (TypeScript)
	• Framework: NestJS
	• Project DB (internal): **MySQL** (A connection pool will be used for all database connections.)
	• Project DB (external, reportinginternal): **SQLServer, Oracle** (A connection pool will be used for all database connections.)
	• Auth: **JWT-based authentication**
	• Config file (project db): `app-dbconfig.json` in project root
	• Config file (report db): `report-dbconfig.json` in project root
