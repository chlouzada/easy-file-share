import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { TunnelCollection } from '@/server/db';

export async function GET(request: Request) {
  const id = request.url.split('/').reverse().shift();
  const doc = await TunnelCollection.findOne({ key: id });
  if (!doc) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ url: doc.url });
}

export async function PUT(request: Request) {
  try {
    const id = request.url.split('/').reverse().shift();
    const body = await request.json();
    const validated = z
      .object({
        id: z.string().max(5),
        url: z.string(),
      })
      .parse({
        id,
        url: body.url,
      });

    await TunnelCollection.updateOne(
      { key: id },
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
}
