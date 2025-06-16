# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm build` - Compile TypeScript to JavaScript in `build/` directory
- `pnpm prepare` - Run husky setup for git hooks
- `eslint --fix src/**/*.ts` - Lint and auto-fix TypeScript files
- `prettier --write --ignore-unknown src/**/*.ts` - Format TypeScript files

## Environment Setup

Required environment variables:

- `ESA_API_TOKEN` - Bearer token for esa API authentication
- `DEFAULT_TEAM_NAME` - Default esa team name (e.g., "docs")

## Architecture Overview

This is an MCP (Model Context Protocol) server that bridges AI assistants with the esa wiki platform.

### Core Structure

- `src/index.ts` - MCP server setup and tool definitions using `@modelcontextprotocol/sdk`
- `src/post.ts` - esa API client functions and TypeScript interfaces
- `build/` - Compiled JavaScript output (git-tracked)

### MCP Server Implementation

The server defines three main tools:

1. `get-posts` - Search and list posts with pagination/filtering
2. `get-post` - Retrieve individual post by number with full content
3. `create-post` - Create new posts with metadata

### Key Patterns

- All parameters use Zod schemas for validation exported from `index.ts`
- API functions in `post.ts` return `null` on errors rather than throwing
- The server uses stdio transport for MCP communication
- Tool responses follow MCP content format with `type: "text"`

### esa API Integration

- Base URL: `https://api.esa.io/v1/teams/{team_name}`
- Authentication via Bearer token in Authorization header
- All requests include error handling with console logging
- Post creation sends data as `{ post: {...} }` JSON payload

## Type System

The codebase uses strict TypeScript configuration with:

- `@tsconfig/strictest` and `@tsconfig/node20` presets
- Zod schemas define runtime validation and TypeScript types
- Interface definitions for esa API responses in `post.ts`
