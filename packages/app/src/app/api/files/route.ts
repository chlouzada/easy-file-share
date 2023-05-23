import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { FileCollection } from '@/server/db';

// 5 minutes
const TIME_LIMIT = 1000 * 60 * 5;

const clearOldFiles = async () => {
  const now = new Date();
  await FileCollection.deleteMany({
    createdAt: { $lt: new Date(now.getTime() - TIME_LIMIT) },
  });
};

export async function GET(request: Request) {
  await clearOldFiles();
  const { searchParams } = new URL(request.url);
  const id = z.string().min(1).parse(searchParams.get('id'));
  const doc = await FileCollection.findOne({ key: id });
  if (!doc) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ name: doc.name, encoded: doc.encoded });
}

export async function POST(request: Request) {
  await clearOldFiles();
  try {
    const body = await request.json();
    const validated = z
      .object({
        name: z.string().max(100),
        encoded: z.string(),
      })
      .parse(body);

    const key = nanoid(5);

    await FileCollection.insertOne({
      key,
      ...validated,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: key });
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
