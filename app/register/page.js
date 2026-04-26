"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/backend_link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        role: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async () => {
        setError("");

        if (!form.username || !form.email || !form.password || !form.role) {
            setError("All fields are required");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/register", form);
            const { message, success } = res.data;

            if (!success) {
                setError(message);
                return;
            }

            alert("Registered successfully");

            setForm({
                username: "",
                email: "",
                password: "",
                role: "",
            });

            router.push("/login");
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
                        Create Account
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Enter your details below
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Username */}
                    <div className="space-y-1">
                        <Label>Username</Label>
                        <Input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <Label>Password</Label>
                        <Input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 🆕 Role Dropdown */}
                    <div className="space-y-1">
                        <Label>Role</Label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        >
                            <option value="">Select Role</option>
                            <option value="supplier">Supplier</option>
                            <option value="buyer">Buyer</option>
                        </select>
                    </div>

                    {/* Error */}
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {/* Submit */}
                    <Button
                        className="w-full"
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Register"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
