#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const token = process.env["ESA_ACCESS_TOKEN"];
const ESA_API_BASE = "https://api.esa.io";

if (!token) {
	console.error("ESA_ACCESS_TOKEN environment variable is not set");
	process.exit(1);
}

const server = new McpServer({
	name: "esa",
	version: "0.2.1",
});

type GetPostsOptions = z.infer<typeof GetPostsOptions>;

async function getPosts({
	teamName,
	q,
	include,
	sort,
	order,
	page,
	perPage,
}: GetPostsOptions) {
	const url = new URL(`/v1/teams/${teamName}/posts`, ESA_API_BASE);

	if (q) url.searchParams.set("q", q);
	if (include) url.searchParams.set("include", include.join(","));
	if (sort) url.searchParams.set("sort", sort);
	if (order) url.searchParams.set("order", order);
	if (page) url.searchParams.set("page", page.toString());
	if (perPage) url.searchParams.set("per_page", perPage.toString());

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message);
	}

	return await response.json();
}

const Page = z.number().int().min(1).optional();
const PerPage = z.number().int().min(1).max(100).optional();
const PaginationOptions = z.object({
	page: Page,
	perPage: PerPage,
});
const TeamName = z.string();
const Q = z.string().optional();
const Include = z
	.enum(["comments", "comments.stargazers", "stargazers"])
	.array()
	.optional();
const Sort = z
	.enum([
		"updated",
		"created",
		"number",
		"stars",
		"watchers",
		"comments",
		"best_match",
	])
	.optional();
const Order = z.enum(["desc", "asc"]).optional();
const GetPostsOptions = PaginationOptions.extend({
	teamName: TeamName,
	q: Q,
	include: Include,
	sort: Sort,
	order: Order,
});

server.registerTool(
	"get-posts",
	{
		title: "Posts Fetcher",
		description: "Get esa posts",
		inputSchema: {
			teamName: TeamName,
			q: Q,
			include: Include,
			sort: Sort,
			order: Order,
			page: Page,
			perPage: PerPage,
		},
	},
	async (params) => {
		try {
			const data = await getPosts(params);
			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};
			}
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: An unknown error occurred`,
					},
				],
			};
		}
	},
);

type GetPostOptions = z.infer<typeof GetPostOptions>;

async function getPost({ teamName, postNumber, include }: GetPostOptions) {
	const url = new URL(
		`/v1/teams/${teamName}/posts/${postNumber}`,
		ESA_API_BASE,
	);
	if (include) {
		url.searchParams.set("include", include.join(","));
	}
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message);
	}

	return await response.json();
}

const PostNumber = z.number().int();
const GetPostOptions = z.object({
	teamName: TeamName,
	postNumber: PostNumber,
	include: Include.optional(),
});

server.registerTool(
	"get-post",
	{
		title: "Post Fetcher",
		description: "Get esa post by post number",
		inputSchema: {
			teamName: TeamName,
			postNumber: PostNumber,
			include: Include,
		},
	},
	async (params) => {
		try {
			const data = await getPost(params);
			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};
			}
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: An unknown error occurred`,
					},
				],
			};
		}
	},
);

type CreatePostOptions = z.infer<typeof CreatePostOptions>;

async function createPost({
	teamName,
	name,
	bodyMd,
	tags,
	category,
	wip,
	message,
	user,
	templatePostId,
}: CreatePostOptions) {
	const url = new URL(`/v1/teams/${teamName}/posts`, ESA_API_BASE);
	const json = JSON.stringify({
		post: {
			name,
			body_md: bodyMd,
			tags,
			category,
			wip,
			message,
			user,
			templatePostId,
		},
	});
	const response = await fetch(url, {
		method: "POST",
		body: json,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message);
	}

	return await response.json();
}

const Name = z.string();
const BodyMd = z.string().optional();
const Tags = z.string().array().optional();
const Category = z.string().optional();
const Wip = z.boolean().optional();
const Message = z.string().optional();
const User = z.string().optional();
const TemplatePostId = z.number().int().optional();
const CreatePostOptions = z.object({
	teamName: TeamName,
	name: Name,
	bodyMd: BodyMd,
	tags: Tags,
	category: Category,
	wip: Wip,
	message: Message,
	user: User,
	templatePostId: TemplatePostId,
});

server.registerTool(
	"create-post",
	{
		title: "Post Creator",
		description: "Create post",
		inputSchema: {
			teamName: TeamName,
			name: Name,
			bodyMd: BodyMd,
			tags: Tags,
			category: Category,
			wip: Wip,
			message: Message,
			user: User,
			templatePostId: TemplatePostId,
		},
	},
	async (params) => {
		try {
			const data = await createPost(params);
			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};
			}
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: An unknown error occurred`,
					},
				],
			};
		}
	},
);

type EditPostOptions = z.infer<typeof EditPostOptions>;

async function editPost({
	teamName,
	postNumber,
	name,
	bodyMd,
	tags,
	category,
	wip,
	message,
	createdBy,
	updatedBy,
	originalRevision,
}: EditPostOptions) {
	const url = new URL(
		`/v1/teams/${teamName}/posts/${postNumber}`,
		ESA_API_BASE,
	);
	const json = JSON.stringify({
		post: {
			name,
			body_md: bodyMd,
			tags,
			category,
			wip,
			message,
			created_by: createdBy,
			updated_by: updatedBy,
			original_revision: originalRevision,
		},
	});
	const response = await fetch(url, {
		method: "PATCH",
		body: json,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message);
	}

	return await response.json();
}

const OriginalRevision = z
	.object({
		bodyMd: BodyMd,
		number: z.number().int().optional(),
		user: User,
	})
	.optional();
const EditPostOptions = z.object({
	teamName: TeamName,
	postNumber: PostNumber,
	name: Name.optional(),
	bodyMd: BodyMd,
	tags: Tags,
	category: Category,
	wip: Wip,
	message: Message,
	createdBy: User,
	updatedBy: User,
	originalRevision: OriginalRevision,
});

server.registerTool(
	"edit-post",
	{
		title: "Post Editor",
		description: "Edit post",
		inputSchema: {
			teamName: TeamName,
			postNumber: PostNumber,
			name: Name.optional(),
			bodyMd: BodyMd,
			tags: Tags,
			category: Category,
			wip: Wip,
			message: Message,
			createdBy: User,
			updatedBy: User,
			originalRevision: OriginalRevision,
		},
	},
	async (params) => {
		try {
			const data = await editPost(params);
			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};
			}
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: An unknown error occurred`,
					},
				],
			};
		}
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
