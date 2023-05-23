import { MongoClient } from 'mongodb';
 
const client = new MongoClient(process.env.MONGO_URL!)

export const FileCollection = client.db('easy-file-share').collection('files');
export const TunnelCollection = client.db('easy-file-share').collection('tunnels');