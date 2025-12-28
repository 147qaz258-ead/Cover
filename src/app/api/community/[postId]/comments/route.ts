import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// GET /api/community/[postId]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // TODO: Replace with Prisma query
    // const comments = await prisma.comment.findMany({
    //   where: { postId },
    //   include: {
    //     user: { select: { id: true, name: true, image: true } },
    //   },
    //   orderBy: { createdAt: "desc" },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });

    return NextResponse.json({
      comments: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/community/[postId]/comments - Add a comment to a post
const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const data = createCommentSchema.parse(body);

    // TODO: Get userId from session
    const userId = "mock-user-id";

    // TODO: Replace with Prisma query
    // const comment = await prisma.comment.create({
    //   data: {
    //     userId,
    //     postId,
    //     content: data.content,
    //   },
    //   include: {
    //     user: { select: { id: true, name: true, image: true } },
    //   },
    // });

    return NextResponse.json({ comment: null }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 });
    }
    console.error("Failed to create comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
