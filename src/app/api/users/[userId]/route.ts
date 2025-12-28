import { NextRequest, NextResponse } from "next/server";

// GET /api/users/[userId] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // TODO: Get current userId from session for follow status
    const currentUserId = "mock-current-user-id";

    // TODO: Replace with Prisma query
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: {
    //     id: true,
    //     name: true,
    //     image: true,
    //     createdAt: true,
    //     _count: {
    //       select: {
    //         posts: true,
    //         followers: true,
    //         following: true,
    //       },
    //     },
    //   },
    // });

    // if (!user) {
    //   return NextResponse.json({ error: "User not found" }, { status: 404 });
    // }

    // Check if current user is following this user
    // const isFollowing = currentUserId
    //   ? await prisma.follow.findUnique({
    //       where: {
    //         followerId_followingId: {
    //           followerId: currentUserId,
    //           followingId: userId,
    //         },
    //       },
    //     })
    //   : false;

    return NextResponse.json({
      user: null,
      isFollowing: false,
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

// PATCH /api/users/[userId] - Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    // TODO: Get userId from session and verify ownership
    const currentUserId = "mock-user-id";

    // if (userId !== currentUserId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    // TODO: Replace with Prisma query
    // const user = await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     name: body.name,
    //     image: body.image,
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     image: true,
    //   },
    // });

    return NextResponse.json({ user: null });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
  }
}
