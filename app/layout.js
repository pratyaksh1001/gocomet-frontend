"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { api } from "@/backend_link";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
});

export default function RootLayout({ children }) {
    const [username, setUsername] = useState(null);

    useEffect(() => {
        async function authenticate() {
            try {
                const token = Cookies.get("token");

                if (!token) {
                    setUsername(null);
                    return;
                }

                const res = await api.post("/auth", { token });

                if (!res.data.success) {
                    Cookies.remove("token");
                    Cookies.remove("username");
                    setUsername(null);
                } else {
                    // ✅ get username from cookie
                    const user = Cookies.get("username");
                    setUsername(user || "User");
                }
            } catch (err) {
                Cookies.remove("token");
                Cookies.remove("username");
                setUsername(null);
                console.error(err);
            }
        }

        authenticate();
    }, []);

    return (
        <html lang="en" className={inter.className}>
            <body className="min-h-screen bg-background">
                {/* 🔝 Top Bar */}
                <div className="w-full border-b px-6 py-3 flex items-center justify-between">
                    {/* Left */}
                    <div className="font-semibold text-lg">pratyaksh</div>

                    {/* Center Links */}
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-primary">
                            Home
                        </Link>
                        <Link
                            href="/create-auction"
                            className="hover:text-primary"
                        >
                            Create
                        </Link>
                        <Link href="/auctions" className="hover:text-primary">
                            Auctions
                        </Link>
                    </div>

                    {/* Right */}
                    <div>
                        {username ? (
                            <button className="px-3 py-1 border rounded-md text-sm hover:bg-accent">
                                {username}
                            </button>
                        ) : (
                            <Link href="/login">
                                <button className="px-3 py-1 border rounded-md text-sm hover:bg-accent">
                                    Login
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">{children}</div>
            </body>
        </html>
    );
}
