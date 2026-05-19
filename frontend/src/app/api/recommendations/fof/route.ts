import { NextResponse } from 'next/server';
import { friendOfFriendRecommendations } from '@/lib/recommendations';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  if (!userName) {
    return NextResponse.json({ error: 'Missing query param: userName' }, { status: 400 });
  }

  try {
    const data = await friendOfFriendRecommendations({ userName, limit });
    return NextResponse.json(data);
  } catch (err) {
    console.error('fof failed', err);
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Neo4j query failed'
        : getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
