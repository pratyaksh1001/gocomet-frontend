"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/backend_link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function CreateAuctionPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        rfq_name: "",
        start_time: "",
        forced_close_time: "",
        extension_duration: "",
        pickup_date: "",
        trigger: "", // 🆕 NEW FIELD
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 🔐 ROLE CHECK
    useEffect(() => {
        const token = Cookies.get("token");
        const role = Cookies.get("role");

        if (!token) {
            router.push("/login");
            return;
        }

        if (role === "supplier") {
            router.push("/");
        }
    }, [router]);

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
            trigger,
        } = form;

        if (
            !rfq_name ||
            !start_time ||
            !forced_close_time ||
            !extension_duration ||
            !pickup_date ||
            !trigger
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
                trigger: Number(trigger), // 🔥 send as number
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
                trigger: "",
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
                    {/* Name */}
                    <div className="space-y-1">
                        <Label>Name</Label>
                        <Input
                            name="rfq_name"
                            value={form.rfq_name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Start */}
                    <div className="space-y-1">
                        <Label>Start Time</Label>
                        <Input
                            name="start_time"
                            type="datetime-local"
                            value={form.start_time}
                            onChange={handleChange}
                        />
                    </div>

                    {/* End */}
                    <div className="space-y-1">
                        <Label>Forced Close Time</Label>
                        <Input
                            name="forced_close_time"
                            type="datetime-local"
                            value={form.forced_close_time}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Extension */}
                    <div className="space-y-1">
                        <Label>Extension Duration (minutes)</Label>
                        <Input
                            name="extension_duration"
                            type="number"
                            value={form.extension_duration}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Pickup */}
                    <div className="space-y-1">
                        <Label>Pickup Date</Label>
                        <Input
                            name="pickup_date"
                            type="date"
                            value={form.pickup_date}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 🆕 Trigger */}
                    <div className="space-y-1">
                        <Label>Extension Trigger</Label>
                        <select
                            name="trigger"
                            value={form.trigger}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        >
                            <option value="">Select Trigger</option>
                            <option value="1">
                                Extend if best bid changes
                            </option>
                            <option value="2">Extend if ranking changes</option>
                            <option value="3">Extend on any new bid</option>
                        </select>
                    </div>

                    {/* Error */}
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {/* Submit */}
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
