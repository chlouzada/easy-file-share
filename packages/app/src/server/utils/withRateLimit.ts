import { NextResponse, NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
              
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const rl = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 s'),
});

export const withRateLimit =
  (cb: (req: NextRequest) => Promise<NextResponse>) =>
  async (req: NextRequest) => {
    console.time('1');
    const ip = req.headers.get('x-forwarded-for') ?? 'DEFAULT';
    const data = await rl.limit(ip);
    console.log(data);
    const { success, reset } = data;
    console.timeEnd('1');

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
