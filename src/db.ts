import Dexie, { type Table } from 'dexie';
import type { UserData } from './app/components/Registration';
import type { TraditionalUserData } from './app/components/TraditionalRegistration';

export interface User extends UserData {
    id?: number;
    password?: string;
    faceData?: number[]; // Placeholder for future face embeddings
}

export interface Transaction {
    id?: number;
    type: 'sent' | 'received';
    amount: number;
    recipient: string;
    date: string;
    status: 'completed' | 'pending';
}

export class FaceLoginDB extends Dexie {
    users!: Table<User>;
    transactions!: Table<Transaction>;

    constructor() {
        super('FaceLoginDB');
        this.version(1).stores({
            users: '++id, fullName, email, phone', // Primary key and indexed props
            transactions: '++id, type, amount, recipient, date, status'
        });
    }
}

export const db = new FaceLoginDB();
