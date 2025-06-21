# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for esa, a documentation platform. The server exposes esa's API through MCP tools and resources, allowing AI assistants to fetch posts, create posts, and access esa content.

## Development Commands

- **Build**: `pnpm build` or `npm run build` - Compiles TypeScript to JavaScript in the `build/` directory
- **Linting**: Project uses ESLint with TypeScript ESLint rules. Lint-staged is configured to auto-fix on commit
- **Formatting**: Prettier is configured and runs automatically via lint-staged on commit
- **Package Manager**: Uses pnpm (specified in packageManager field)

## Architecture

### Core Structure

- **Single file architecture**: All code is in `src/index.ts`
- **MCP Server**: Built using `@modelcontextprotocol/sdk`
- **Transport**: Uses StdioServerTransport for communication
- **Authentication**: Requires `ESA_ACCESS_TOKEN` environment variable

### MCP Implementation

The server registers:

1. **Tools**:

   - `get-posts`: Fetches esa posts with search, filtering, and pagination
   - `create-post`: Creates new esa posts

2. **Resources**:
   - `post`: Resource template for individual posts at `esa://{team_name}/posts/{post_number}`

### Key Functions

- `getPosts()`: Handles esa API calls for fetching posts with comprehensive query parameters
- `getPost()`: Fetches individual posts by team name and post number
- `createPost()`: Creates new posts via esa API

### Validation & Types

- Uses Zod for runtime validation and type inference
- Comprehensive schemas for all API parameters including pagination, sorting, filtering
- Type-safe parameter handling with `z.infer<typeof Schema>`

### Error Handling

- Validates environment variables on startup
- Structured error responses in MCP tool handlers
- Proper HTTP error handling with esa API error messages

## Configuration

- **TypeScript**: Strict mode enabled with comprehensive compiler options
- **Module System**: ES modules (`"type": "module"`)
- **Target**: ES2023 with Node.js Next module resolution
- **Binary**: Executable at `build/index.js`

## Environment Setup

Required environment variable:

- `ESA_ACCESS_TOKEN`: esa API access token for authentication

## esa API Integration

Base URL: `https://api.esa.io`

- Uses Bearer token authentication
- Implements esa's posts API endpoints (/v1/teams/{team}/posts)
- Supports full range of esa query parameters (search, include, sort, pagination)
