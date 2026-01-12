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

        // Use TinyFaceDetector for performance, or SSD for accuracy
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return null;
        }

        return detection;
    }

    matchFace(descriptor: Float32Array, users: any[]): any | null {
        if (!users || users.length === 0) return null;

        const labeledDescriptors = users
            .filter(user => user.faceData) // Only users with face data
            .map(user => {
                // Convert stored object/array back to Float32Array
                const floatArray = new Float32Array(Object.values(user.faceData));
                return new faceapi.LabeledFaceDescriptors(user.email, [floatArray]);
            });

        if (labeledDescriptors.length === 0) return null;

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        const match = faceMatcher.findBestMatch(descriptor);

        if (match.label !== 'unknown') {
            return users.find(u => u.email === match.label);
        }

        return null;
    }
}

export const faceService = new FaceService();
