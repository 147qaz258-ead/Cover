import { NextRequest, NextResponse } from "next/server";

// POST /api/community/[postId]/like - Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // TODO: Get userId from session
    const userId = "mock-user-id";

    // TODO: Replace with Prisma query
    // Check if user already liked the post
    // const existingLike = await prisma.like.findUnique({
    //   where: {
    //     userId_postId: { userId, postId },
    //   },
    // });

    // if (existingLike) {
    //   // Unlike
    //   await prisma.like.delete({
    //     where: { id: existingLike.id },
    //   });
    //   await prisma.post.update({
    //     where: { id: postId },
    //     data: { likeCount: { decrement: 1 } },
    //   });
    //   return NextResponse.json({ liked: false, likeCount: post.likeCount - 1 });
    // } else {
    //   // Like
    //   await prisma.like.create({
    //     data: { userId, postId },
    //   });
    //   const post = await prisma.post.update({
    //     where: { id: postId },
    //     data: { likeCount: { increment: 1 } },
    //   });
    //   return NextResponse.json({ liked: true, likeCount: post.likeCount });
    // }

    return NextResponse.json({ liked: true, likeCount: 0 });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
