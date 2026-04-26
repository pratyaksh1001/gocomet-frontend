/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: [
        "127.0.0.1",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    env: {
        BACKEND_URL: process.env.BACKEND_URL,
        BACKEND_WS: process.env.BACKEND_WS,
    },
};

export default nextConfig;
