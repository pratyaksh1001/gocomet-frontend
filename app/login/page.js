"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/backend_link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async () => {
        setError("");

        if (!form.email || !form.password) {
            setError("All fields are required");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/login", form);
            const data = res.data;

            if (!data.success) {
                setError(data.error);
                return;
            }

            // ✅ Store token
            Cookies.set("token", data.token, {
                expires: 1,
                sameSite: "Lax",
            });

            // ✅ Store username
            Cookies.set("username", data.username, {
                expires: 1,
                sameSite: "Lax",
            });

            // ✅ NEW: Store role
            Cookies.set("role", data.role, {
                expires: 1,
                sameSite: "Lax",
            });

            // 🔍 Debug (optional)
            console.log("Role:", data.role);

            // redirect
            router.push("/");
        } catch (err) {
            setError("Something went wrong");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm shadow-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-primary">
                        Login
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Password</Label>
                        <Input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        className="w-full"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Don’t have an account?{" "}
                        <a href="/register" className="text-primary">
                            Register
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
