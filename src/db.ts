import Dexie, { type Table } from 'dexie';
import type { UserData } from './app/components/Registration';
import type { TraditionalUserData } from './app/components/TraditionalRegistration';

export interface User extends UserData {
    id?: number;
    password?: string;
    faceData?: number[] | string; // Encrypted string or Legacy array
    balance?: number;
    avatar?: string; // Base64 image
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
        // Latest Version 3: Adds Avatar
        this.version(3).stores({
            users: '++id, fullName, email, phone',
            transactions: '++id, type, amount, recipient, recipientEmail, senderEmail, date, status'
        });

        // Version 2: Added Balance
        this.version(2).stores({
            users: '++id, fullName, email, phone',
            transactions: '++id, type, amount, recipient, recipientEmail, senderEmail, date, status'
        }).upgrade(tx => {
            return tx.table('users').toCollection().modify(user => {
                if (user.balance === undefined) user.balance = 1000;
            });
        });
    }
}

export const db = new FaceLoginDB();
