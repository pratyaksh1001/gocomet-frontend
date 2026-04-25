"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { api } from "@/backend_link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function CreateAuctionPage() {
    const [form, setForm] = useState({
        rfq_name: "",
        start_time: "",
        forced_close_time: "",
        extension_duration: "",
        pickup_date: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleCreate = async () => {
        setError("");

        const {
            rfq_name,
            start_time,
            forced_close_time,
            extension_duration,
            pickup_date,
        } = form;

        if (
            !rfq_name ||
            !start_time ||
            !forced_close_time ||
            !extension_duration ||
            !pickup_date
        ) {
            setError("All fields are required");
            return;
        }

        if (Number(extension_duration) <= 0) {
            setError("Extension duration must be greater than 0");
            return;
        }

        const token = Cookies.get("token");

        if (!token) {
            setError("Not authenticated");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/auction", {
                ...form,
                token,
            });

            const data = res.data;

            if (!data.success) {
                setError(data.message || "Failed to create auction");
                return;
            }

            alert("Auction created successfully");

            setForm({
                rfq_name: "",
                start_time: "",
                forced_close_time: "",
                extension_duration: "",
                pickup_date: "",
            });
        } catch (err) {
            setError("Something went wrong");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-primary">
                        Create Auction
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>Name</Label>
                        <Input
                            name="rfq_name"
                            value={form.rfq_name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Start Time</Label>
                        <Input
                            name="start_time"
                            type="datetime-local"
                            value={form.start_time}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Forced Close Time</Label>
                        <Input
                            name="forced_close_time"
                            type="datetime-local"
                            value={form.forced_close_time}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Extension Duration (minutes)</Label>
                        <Input
                            name="extension_duration"
                            type="number"
                            value={form.extension_duration}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 🆕 Pickup Date */}
                    <div className="space-y-1">
                        <Label>Pickup Date</Label>
                        <Input
                            name="pickup_date"
                            type="date"
                            value={form.pickup_date}
                            onChange={handleChange}
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        className="w-full"
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Auction"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
