import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { tunnelRepository } from '@/server/db';
import { withRateLimit } from '@/server/utils/withRateLimit';

const DEFAULT_LENGTH = 5;

const getValidKey = async (): Promise<string> => {
  const key = nanoid(DEFAULT_LENGTH).toLowerCase();
  if (key.startsWith('-')) return getValidKey();
  const found = await tunnelRepository.findByKey(key);
  if (found) return getValidKey();
  return key;
};

export const POST = withRateLimit(async function (request: Request) {
  try {
    const body = await request.json();
    const key = await getValidKey();
    const { insertedId } = await tunnelRepository.create({
      key,
      url: body.url,
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
});
