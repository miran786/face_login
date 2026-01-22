import * as faceapi from 'face-api.js';

// Use a public CDN for models to avoid bloating the repo
// For offline support, download these models to /public/models
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

class FaceService {
    private modelsLoaded = false;

    async loadModels() {
        if (this.modelsLoaded) return;

        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            ]);
            this.modelsLoaded = true;
            console.log('Face API models loaded');
        } catch (error) {
            console.error('Error loading Face API models:', error);
            throw error;
        }
    }

    async detectFace(video: HTMLVideoElement) {
        if (!this.modelsLoaded) {
            await this.loadModels();
        }

        // Use SSD Mobilenet V1 for better accuracy
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return null;
        }

        return detection;
    }

    captureFace(video: HTMLVideoElement): string {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Draw the current video frame
            // Flip horizontally to match the mirrored video UI
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
        }
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // Verify user against Python Backend
    async verifyUser(imageBlob: Blob): Promise<any | null> {
        try {
            const formData = new FormData();
            // Convert blob to base64 to send as JSON or send as multipart
            // Let's send as base64 string in JSON to match our python schema

            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onloadend = async () => {
                    const base64data = reader.result as string;

                    try {
                        const response = await fetch('http://localhost:8000/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ image: base64data })
                        });

                        const data = await response.json();
                        if (data.status === 'success') {
                            // Use the returned email to look up the full user details from Dexie
                            // This allows us to keep the frontend session logic same
                            return { email: data.user };
                        }
                        return null;
                    } catch (e) {
                        console.error("Backend verification failed", e);
                        return null;
                    }
                };
                reader.readAsDataURL(imageBlob);
            });

        } catch (error) {
            console.error('Verification error:', error);
            return null;
        }
    }

    // Register user in Python Backend
    async registerUser(imageBlob: Blob, email: string): Promise<boolean> {
        try {
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onloadend = async () => {
                    const base64data = reader.result as string;

                    try {
                        const response = await fetch('http://localhost:8000/register', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ image: base64data, email: email })
                        });

                        const data = await response.json();
                        resolve(data.status === 'success');
                    } catch (e) {
                        console.error("Backend registration failed", e);
                        resolve(false);
                    }
                };
                reader.readAsDataURL(imageBlob);
            });
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    // Capture face as Blob instead of DataURL string for easier handling if needed, 
    // but our backend takes base64 string, so captureFace can stay as is returning DataURL.
    // Helper to get Blob from video for upload
    async captureFaceBlob(video: HTMLVideoElement): Promise<Blob | null> {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
        }
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    }

    // Deprecated: Local matching
    matchFace(descriptor: Float32Array, users: any[]): any | null {
        console.warn("Using deprecated local matching. Please switch to backend verification.");
        return null;
    }
}

export const faceService = new FaceService();
