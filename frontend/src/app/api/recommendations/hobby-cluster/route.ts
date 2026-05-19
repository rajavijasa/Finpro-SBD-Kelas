import { NextResponse } from 'next/server';
import { hobbyCluster } from '@/lib/recommendations';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName');
  const hobbyName = searchParams.get('hobbyName');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  if (!userName) {
    return NextResponse.json({ error: 'Missing query param: userName' }, { status: 400 });
  }

  if (!hobbyName) {
    return NextResponse.json({ error: 'Missing query param: hobbyName' }, { status: 400 });
  }

  try {
    const data = await hobbyCluster({ userName, hobbyName, limit });
    return NextResponse.json(data);
  } catch (err) {
    console.error('hobby-cluster failed', err);
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Neo4j query failed'
        : getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
