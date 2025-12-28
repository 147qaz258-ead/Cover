import { NextRequest, NextResponse } from "next/server";

// GET /api/users/[userId]/posts - Get user's public posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const type = searchParams.get("type") || "posts"; // posts, liked

    // TODO: Replace with Prisma query
    let posts: any[] = [];
    let total = 0;

    // if (type === "posts") {
    //   const [postsData, count] = await Promise.all([
    //     prisma.post.findMany({
    //       where: { userId, isPublic: true },
    //       include: {
    //         user: { select: { id: true, name: true, image: true } },
    //         _count: { select: { likes: true, comments: true } },
    //       },
    //       orderBy: { createdAt: "desc" },
    //       skip: (page - 1) * limit,
    //       take: limit,
    //     }),
    //     prisma.post.count({ where: { userId, isPublic: true } }),
    //   ]);
    //   posts = postsData;
    //   total = count;
    // } else if (type === "liked") {
    //   const [likesData, count] = await Promise.all([
    //     prisma.like.findMany({
    //       where: { userId },
    //       include: {
    //         post: {
    //           include: {
    //             user: { select: { id: true, name: true, image: true } },
    //             _count: { select: { likes: true, comments: true } },
    //           },
    //         },
    //       },
    //       orderBy: { createdAt: "desc" },
    //       skip: (page - 1) * limit,
    //       take: limit,
    //     }),
    //     prisma.like.count({ where: { userId } }),
    //   ]);
    //   posts = likesData.map((like) => like.post);
    //   total = count;
    // }

    return NextResponse.json({
      posts: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user posts:", error);
    return NextResponse.json({ error: "Failed to fetch user posts" }, { status: 500 });
  }
}
