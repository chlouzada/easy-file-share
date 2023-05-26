import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { TunnelCollection } from '@/server/db';
import { ObjectId } from 'mongodb';
import { withRateLimit } from '@/server/utils/withRateLimit';

export const GET = withRateLimit(async function GET(request: Request) {
  const key = request.url.split('/').reverse().shift();
  const doc = await TunnelCollection.findOne({ key });
  if (!doc) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ url: doc.url });
});

export const PUT = withRateLimit(async function PUT(request: Request) {
  try {
    const id = request.url.split('/').reverse().shift();
    const body = await request.json();
    const validated = z
      .object({
        id: z.string().length(24),
        url: z.string(),
      })
      .parse({
        id,
        url: body.url,
      });
    await TunnelCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          url: validated.url,
          updatedAt: new Date(),
        },
      }
    );
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
