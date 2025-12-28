import { NextRequest, NextResponse } from "next/server";

// POST /api/users/[userId]/follow - Toggle follow on a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // TODO: Get current userId from session
    const currentUserId = "mock-current-user-id";

    if (userId === currentUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // TODO: Replace with Prisma query
    // const existingFollow = await prisma.follow.findUnique({
    //   where: {
    //     followerId_followingId: {
    //       followerId: currentUserId,
    //       followingId: userId,
    //     },
    //   },
    // });

    // if (existingFollow) {
    //   // Unfollow
    //   await prisma.follow.delete({
    //     where: { id: existingFollow.id },
    //   });
    //   return NextResponse.json({ following: false });
    // } else {
    //   // Follow
    //   await prisma.follow.create({
    //     data: {
    //       followerId: currentUserId,
    //       followingId: userId,
    //     },
    //   });
    //   return NextResponse.json({ following: true });
    // }

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("Failed to toggle follow:", error);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}

// GET /api/users/[userId]/follow - Check if current user is following this user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // TODO: Get current userId from session
    const currentUserId = "mock-current-user-id";

    // TODO: Replace with Prisma query
    // const follow = await prisma.follow.findUnique({
    //   where: {
    //     followerId_followingId: {
    //       followerId: currentUserId,
    //       followingId: userId,
    //     },
    //   },
    // });

    return NextResponse.json({ isFollowing: false });
  } catch (error) {
    console.error("Failed to check follow status:", error);
    return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 });
  }
}
