import { MongoClient, ObjectId } from 'mongodb';
import { z } from 'zod';

const client = new MongoClient(process.env.MONGO_URL!);

const TunnelCollection = client.db('easy-file-share').collection('tunnels');

const createSchema = z.object({
  key: z.string(),
  url: z.string(),
});

const putSchema = z.object({
  id: z.string().length(24),
  data: z.object({
    url: z.string(),
  }),
});

const _tunnelRepository = {
  create: async (data: z.infer<typeof createSchema>) => {
    return TunnelCollection.insertOne({
      ...createSchema.parse(data),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
  update: async (data: z.infer<typeof putSchema>) => {
    const validated = putSchema.parse(data);
    return TunnelCollection.updateOne(
      { _id: new ObjectId(validated.id) },
      {
        $set: {
          ...validated.data,
          updatedAt: new Date(),
        },
      }
    );
  },
  findByKey: (key: string) => TunnelCollection.findOne({ key }),
};

const proxy = new Proxy(_tunnelRepository, {
  get: (target, prop) => {
    TunnelCollection.deleteMany({
      updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 15) },
    });
    return (target as any)[prop];
  },
});

export { proxy as tunnelRepository };
