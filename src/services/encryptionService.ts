// encryptionService.ts

const KEY_STORAGE_NAME = 'face_wallet_enc_key';

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export const encryptionService = {
    // Get or Generate Key
    async getKey(): Promise<CryptoKey> {
        const storedKey = localStorage.getItem(KEY_STORAGE_NAME);

        if (storedKey) {
            // Import existing key
            const jwk = JSON.parse(storedKey);
            return window.crypto.subtle.importKey(
                'jwk',
                jwk,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        } else {
            // Generate new key
            const key = await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            // Export and save to localStorage
            const jwk = await window.crypto.subtle.exportKey('jwk', key);
            localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(jwk));
            return key;
        }
    },

    // Encrypt Data (Face Descriptor Array -> Encrypted String)
    async encryptData(data: number[]): Promise<string> {
        const key = await this.getKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const encodedData = new TextEncoder().encode(JSON.stringify(data));

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encodedData
        );

        // Combine IV and Ciphertext for storage: IV + Ciphertext
        // Return as Base64 string
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);

        return arrayBufferToBase64(combined.buffer);
    },

    // Decrypt Data (Encrypted String -> Face Descriptor Array)
    async decryptData(encryptedString: string): Promise<number[]> {
        const key = await this.getKey();
        const combined = new Uint8Array(base64ToArrayBuffer(encryptedString));

        // Extract IV (first 12 bytes)
        const iv = combined.slice(0, 12);
        // Extract Ciphertext
        const ciphertext = combined.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        const decodedString = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decodedString) as number[];
    }
};
