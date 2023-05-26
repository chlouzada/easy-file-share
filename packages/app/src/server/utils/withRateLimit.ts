import { NextResponse, NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';

const rl = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, '1 s'),
});

export const withRateLimit =
  (cb: (req: NextRequest) => Promise<NextResponse>) =>
  async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') ?? 'DEFAULT';
    const { success, reset } = await rl.limit(ip);
    if (success) {
      return cb(req);
    }
    return new NextResponse(null, {
      headers: {
        'retry-after': String(reset - Date.now()),
      },
      status: 429,
    });
  };
