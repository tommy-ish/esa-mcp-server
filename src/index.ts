#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ESA_API_BASE = "https://api.esa.io";

const server = new McpServer({
	name: "esa",
	version: "0.1.0",
	capabilities: {
		resources: {},
		tools: {},
	},
});

type TeamName = z.infer<typeof TeamName>;
type Page = z.infer<typeof Page>;
type PerPage = z.infer<typeof PerPage>;
type Q = z.infer<typeof Q>;
type Include = z.infer<typeof Include>;
type Sort = z.infer<typeof Sort>;
type Order = z.infer<typeof Order>;

async function getPosts({
	team_name,
	...params
}: {
	team_name: TeamName;
	page?: Page;
	per_page?: PerPage;
	q?: Q;
	include?: Include;
	sort?: Sort;
	order?: Order;
}): Promise<PostsResponse | null> {
	const token = process.env["ESA_API_TOKEN"];
	if (!token) {
		throw new Error("ESA_API_TOKEN environment variable is not set");
	}

	const postsUrl = new URL(`/v1/teams/${team_name}/posts`, ESA_API_BASE);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			postsUrl.searchParams.append(key, value.toString());
		}
	}
	const headers = new Headers({
		Authorization: `Bearer ${token}`,
	});

	try {
		const response = await fetch(postsUrl, { headers });
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return (await response.json()) as PostsResponse;
	} catch (error) {
		console.error("Error making esa request:", error);
		return null;
	}
}

interface User {
	myself: boolean;
	name: string;
	screen_name: string;
	icon: string;
}

interface Post {
	number: number;
	name: string;
	tags: string[];
	category: string;
	full_name: string;
	wip: boolean;
	body_md: string;
	body_html: string;
	created_at: string;
	updated_at: string;
	message: string;
	revision_number: number;
	created_by: User;
	updated_by: User;
	kind: "stock" | "flow";
	comments_count: number;
	tasks_count: number;
	done_tasks_count: number;
	stargazers_count: number;
	watchers_count: number;
	star: boolean;
	watch: boolean;
}

function formatPost(post: Post): string {
	return `Number: ${post.number}
Name: ${post.name}
Tags: ${post.tags.join(", ")}
Category: ${post.category}
WIP: ${post.wip}
Created at: ${post.created_at}
Updated at: ${post.updated_at}
Created by: ${post.created_by.screen_name}
Updated by: ${post.updated_by.screen_name}
Comments: ${post.comments_count}
Stargazers: ${post.stargazers_count}
Watchers: ${post.watchers_count}
Star: ${post.star}
Watch: ${post.watch}
---`;
}

interface PostsResponse {
	posts: Post[];
	prev_page: string | null;
	next_page: string | null;
	total_count: number;
	page: number;
	per_page: number;
	max_per_page: number;
}

const team_name = process.env["DEFAULT_TEAM_NAME"];
if (!team_name) {
	throw new Error("DEFAULT_TEAM_NAME environment variable is not set");
}

const TeamName = z
	.string()
	.default(team_name)
	.describe("Team name (e.g. docs)");
const Page = z
	.number()
	.int()
	.max(100)
	.optional()
	.describe("Page number for pagination (default: 1)");
const PerPage = z
	.number()
	.int()
	.optional()
	.describe("Number of posts per page (default: 20, max: 100)");
const Q = z
	.string()
	.optional()
	.describe("Search query (see esa search syntax)");
const Include = z.string().optional().describe("");
const Sort = z
	.enum([
		"updated",
		"created",
		"number",
		"stars",
		"watches",
		"comments",
		"best_match",
	])
	.optional()
	.describe("Sort (default: updated)");
const Order = z
	.enum(["desc", "asc"])
	.optional()
	.describe("Order of posts (default: desc)");

server.tool(
	"get-posts",
	"Get posts",
	{
		team_name: TeamName,
		page: Page,
		per_page: PerPage,
		q: Q,
		include: Include,
		sort: Sort,
		order: Order,
	},
	async (params) => {
		const postsData = await getPosts(params);

		if (!postsData) {
			return {
				content: [
					{
						type: "text",
						text: "Failed to retrieve posts data",
					},
				],
			};
		}

		const posts = postsData.posts;
		if (posts.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: `No posts for ${params.q}`,
					},
				],
			};
		}

		const formattedPosts = posts.map(formatPost);
		const postsText = `Found posts for ${params.q}: \n\n${formattedPosts.join("\n")}`;

		return {
			content: [
				{
					type: "text",
					text: postsText,
				},
			],
		};
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
