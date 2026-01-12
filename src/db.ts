import Dexie, { type Table } from 'dexie';
import type { UserData } from './app/components/Registration';
import type { TraditionalUserData } from './app/components/TraditionalRegistration';

export interface User extends UserData {
    id?: number;
    password?: string;
    faceData?: number[]; // Placeholder for future face embeddings
    balance?: number;
}

export interface Transaction {
    id?: number;
    type: 'sent' | 'received';
    amount: number;
    recipient: string; // Display name or email
    recipientEmail?: string; // For linking
    senderEmail?: string;    // For linking
    date: string;
    status: 'completed' | 'pending';
}

export class FaceLoginDB extends Dexie {
    users!: Table<User>;
    transactions!: Table<Transaction>;

    constructor() {
        super('FaceLoginDB');
        this.version(2).stores({
            users: '++id, fullName, email, phone', // Primary key and indexed props
            transactions: '++id, type, amount, recipient, recipientEmail, senderEmail, date, status'
        }).upgrade(tx => {
            // Migration to add default balance to existing users if needed
            return tx.table('users').toCollection().modify(user => {
                if (user.balance === undefined) user.balance = 1000;
            });
        });
    }
}

export const db = new FaceLoginDB();
