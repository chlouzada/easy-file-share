import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { TunnelCollection } from '@/server/db';

const DEFAULT_LENGTH = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = z
      .object({
        url: z.string(),
        options: z
          .object({
            keyLenght: z.number().optional(),
          })
          .optional(),
      })
      .parse(body);
    const getKey = (): string => {
      const key = nanoid(validated.options?.keyLenght ?? DEFAULT_LENGTH);
      if (key.startsWith('-')) return getKey();
      return key;
    };
    const key = getKey();
    const { insertedId } = await TunnelCollection.insertOne({
      key,
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return NextResponse.json({ id: insertedId.toString(), key });
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
