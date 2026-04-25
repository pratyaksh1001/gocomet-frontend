"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/backend_link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const router = useRouter();

    const [auctions, setAuctions] = useState([]);
    const [status, setStatus] = useState("active");
    const [loading, setLoading] = useState(false);

    const fetchData = async (type) => {
        setLoading(true);
        try {
            const res = await api.get(`/home?status=${type}`);
            const data = res.data;

            if (data.success) {
                setAuctions(data.result);
                setStatus(type);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData("active");
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex gap-3">
                <Button
                    variant={status === "active" ? "default" : "outline"}
                    onClick={() => fetchData("active")}
                >
                    Active
                </Button>

                <Button
                    variant={status === "closed" ? "default" : "outline"}
                    onClick={() => fetchData("closed")}
                >
                    Closed
                </Button>

                <Button
                    variant={status === "forced_closed" ? "default" : "outline"}
                    onClick={() => fetchData("forced_closed")}
                >
                    Forced Closed
                </Button>
            </div>

            {loading && <p className="text-muted-foreground">Loading...</p>}

            {!loading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {auctions.length === 0 ? (
                        <p className="text-muted-foreground">
                            No auctions found
                        </p>
                    ) : (
                        auctions.map((a) => (
                            <div
                                key={a.rfq_id}
                                className="cursor-pointer hover:scale-[1.02] transition"
                                onClick={() =>
                                    router.push(`/auction/${a.rfq_id}`)
                                }
                            >
                                <Card className="hover:shadow-md transition">
                                    <CardContent className="p-4 space-y-2">
                                        <h2 className="text-lg font-semibold">
                                            {a.rfq_name}
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            Owner: {a.owner_username}
                                        </p>

                                        <p className="text-sm">
                                            Start:{" "}
                                            {new Date(
                                                a.start_time,
                                            ).toLocaleString()}
                                        </p>

                                        <p className="text-sm">
                                            Ends:{" "}
                                            {new Date(
                                                a.forced_close_time,
                                            ).toLocaleString()}
                                        </p>

                                        <p className="text-sm">
                                            Pickup:{" "}
                                            {new Date(
                                                a.pickup_date,
                                            ).toLocaleDateString()}
                                        </p>

                                        <p className="text-sm">
                                            Extension: {a.extension_duration}{" "}
                                            min
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
