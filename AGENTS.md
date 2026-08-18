# SST v3 Monorepo Project

This is an SST v3 monorepo with TypeScript. The project uses bun workspaces for package management.

## Project Structure

- `app/` - Contains all backend packages (functions, core, etc.)
- `fronted/` - all the frontend related things (storage.ts, api.ts, web.ts)

## Code Standards

- Inspect the existing code and relevant documentation before making changes.
- Follow existing architecture and patterns.
- Do not invent APIs, data structures, dependencies, or behavior without getting approval.
- Ask before making decisions that materially affect architecture, APIs, database structure, security, or significant UX.
- Keep changes scoped to the requested feature.
- Test meaningful observable behavior using black-box tests. Don't write test for every last line of code. Only things that are critical and might break the project if something else is changed and require that level of attention.
- Verify changes before claiming they work.
- After the completion of every phase, update the `PROJECT_BUILD_PHASES.md` file.

## Monorepo Conventions
