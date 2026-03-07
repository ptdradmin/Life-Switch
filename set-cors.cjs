// Script pour configurer CORS sur Firebase Storage
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
    projectId: "life-switch-mvp-2026",
    keyFilename: "./firebase-service-account.json",
});

const corsConfig = [
    {
        origin: ["*"],
        method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
        responseHeader: [
            "Content-Type",
            "Authorization",
            "Content-Length",
            "x-goog-resumable",
            "User-Agent",
        ],
        maxAgeSeconds: 3600,
    },
];

async function setCors() {
    const bucketNames = [
        "life-switch-mvp-2026.firebasestorage.app",
        "life-switch-mvp-2026.appspot.com",
    ];

    for (const bucketName of bucketNames) {
        try {
            const bucket = storage.bucket(bucketName);
            const [metadata] = await bucket.getMetadata().catch(() => [null]);
            if (!metadata) {
                console.log(`❌ Bucket not found: ${bucketName}`);
                continue;
            }
            await bucket.setCorsConfiguration(corsConfig);
            console.log(`✅ CORS set on: ${bucketName}`);
        } catch (e) {
            console.log(`❌ Error on ${bucketName}:`, e.message);
        }
    }
}

setCors().then(() => console.log("Done")).catch(console.error);
