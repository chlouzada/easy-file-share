import { MongoClient } from 'mongodb';
 
const client = new MongoClient(process.env.MONGO_URL!)

export const TunnelCollection = client.db('easy-file-share').collection('tunnels');