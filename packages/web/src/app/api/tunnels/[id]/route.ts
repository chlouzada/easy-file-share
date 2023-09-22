import { NextResponse } from 'next/server';
import { z } from 'zod';
import { tunnelRepository } from '@/server/db';
import { withRateLimit } from '@/server/utils/withRateLimit';

export const GET = withRateLimit(async function (request: Request) {
  const key = request.url.split('/').reverse().shift()!;
  if (!key) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const doc = await tunnelRepository.findByKey(key);
  if (!doc) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ url: doc.url });
});

export const PUT = withRateLimit(async function (request: Request) {
  try {
    const id = request.url.split('/').reverse().shift();
    if (!id) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    await tunnelRepository.update({
      id,
      data: await request.json(),
    });
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    } else {
      console.log(error);
      return NextResponse.json(
        { error: 'internal server error' },
        { status: 500 }
      );
    }
  }
});
