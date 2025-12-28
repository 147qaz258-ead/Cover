import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Mock data - Replace with Prisma queries when database is available
const mockPosts: any[] = [];

// GET /api/community - Get public posts with pagination
const getQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  platform: z.enum(["xiaohongshu", "wechat", "douyin", "taobao"]).optional(),
  sortBy: z.enum(["latest", "popular"]).default("latest"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = getQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Replace with Prisma query when database is available
    // const posts = await prisma.post.findMany({
    //   where: {
    //     isPublic: true,
    //     ...(query.platform && { platformId: query.platform }),
    //   },
    //   include: {
    //     user: { select: { id: true, name: true, image: true } },
    //     _count: { select: { likes: true, comments: true } },
    //   },
    //   orderBy: query.sortBy === "latest" ? { createdAt: "desc" } : { likeCount: "desc" },
    //   skip: (query.page - 1) * query.limit,
    //   take: query.limit,
    // });

    // Return mock empty array for now
    return NextResponse.json({
      posts: [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.errors }, { status: 400 });
    }
    console.error("Failed to fetch community posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/community - Create a new public post
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  platformId: z.string(),
  prompt: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createPostSchema.parse(body);

    // TODO: Get userId from session
    const userId = "mock-user-id";

    // TODO: Replace with Prisma query
    // const post = await prisma.post.create({
    //   data: {
    //     userId,
    //     ...data,
    //     isPublic: true,
    //   },
    //   include: {
    //     user: { select: { id: true, name: true, image: true } },
    //   },
    // });

    return NextResponse.json({ post: null }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 });
    }
    console.error("Failed to create post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
