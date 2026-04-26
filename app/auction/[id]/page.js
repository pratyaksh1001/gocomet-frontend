"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/backend_link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuctionPage() {
    const { id } = useParams();
    const router = useRouter();
    const wsRef = useRef(null);

    const [rfq, setRfq] = useState(null);
    const [bids, setBids] = useState([]);
    const [bestBid, setBestBid] = useState(null);

    const [form, setForm] = useState({
        freight_charges: "",
        origin_charges: "",
        destination_charges: "",
        transit_time: "",
        validity_period: "",
    });

    const [loading, setLoading] = useState(true);

    const role = Cookies.get("role");

    // 🔐 ROLE CHECK
    useEffect(() => {
        if (!role) {
            router.push("/login");
            return;
        }

        if (role !== "supplier") {
            router.push("/"); // ❌ buyers redirected
        }
    }, [role, router]);

    // 🔁 Fetch RFQ
    const fetchData = async () => {
        try {
            const res = await api.get(`/auction/${id}`);
            const data = res.data;

            if (data.rfq) {
                setRfq(data.rfq);
                setBids(data.rfq.bids || []);

                if (data.rfq.bids?.length > 0) {
                    const best = data.rfq.bids.reduce((min, b) =>
                        b.bid_amount < min.bid_amount ? b : min,
                    );
                    setBestBid(best);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    // 🔌 WebSocket
    useEffect(() => {
        if (!id || role !== "supplier") return;

        const ws = new WebSocket(`ws://127.0.0.1:8000/auction/ws/${id}`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    type: "AUTH",
                    token: Cookies.get("token"),
                }),
            );
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "UPDATE") {
                setBestBid(data.highest);

                setBids((prev) => {
                    const exists = prev.some(
                        (b) =>
                            b.bid_amount === data.new_bid.bid_amount &&
                            b.owner_email === data.new_bid.owner_email,
                    );
                    return exists ? prev : [...prev, data.new_bid];
                });
            }
        };

        return () => ws.close();
    }, [id, role]);

    // ✍️ Form
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // 💰 Send bid
    const handleBid = () => {
        if (!wsRef.current || wsRef.current.readyState !== 1) return;

        if (
            !form.freight_charges ||
            !form.origin_charges ||
            !form.destination_charges
        ) {
            alert("Fill all charges");
            return;
        }

        const bid_amount =
            Number(form.freight_charges) +
            Number(form.origin_charges) +
            Number(form.destination_charges);

        wsRef.current.send(
            JSON.stringify({
                type: "BID",
                ...form,
                bid_amount,
                auction_id: id,
            }),
        );
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!rfq) return <div className="p-6">Auction not found</div>;

    return (
        <div className="flex gap-6 p-6">
            {/* 🧾 LEFT */}
            <div className="w-1/3">
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <h2 className="text-xl font-semibold">
                            {rfq.rfq_name}
                        </h2>

                        {Object.entries(rfq).map(([key, value]) => {
                            if (key === "bids") return null;

                            return (
                                <p key={key}>
                                    <b>{key}:</b>{" "}
                                    {typeof value === "string" &&
                                    !isNaN(Date.parse(value))
                                        ? new Date(value).toLocaleString()
                                        : String(value)}
                                </p>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* 📊 RIGHT */}
            <div className="w-2/3 space-y-6">
                {/* 🏆 BEST */}
                {bestBid && (
                    <Card className="border-green-500">
                        <CardContent className="p-4">
                            <h3 className="text-green-600 font-semibold">
                                Best Bid
                            </h3>
                            <p>{bestBid.owner_email}</p>
                            <p>₹{bestBid.bid_amount}</p>
                        </CardContent>
                    </Card>
                )}

                {/* 📜 BIDS */}
                <div className="space-y-3">
                    {bids.map((b, idx) => (
                        <Card key={idx}>
                            <CardContent className="p-3 text-sm">
                                <p className="font-medium">{b.owner_email}</p>
                                <p>₹{b.bid_amount}</p>
                                <p>
                                    F {b.freight_charges} | O {b.origin_charges}{" "}
                                    | D {b.destination_charges}
                                </p>
                                <p>Transit: {b.transit_time}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ✍️ FORM (ONLY FOR SUPPLIER) */}
                {role === "supplier" && (
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <h3 className="font-semibold">Place Bid</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    name="freight_charges"
                                    placeholder="Freight"
                                    onChange={handleChange}
                                />
                                <Input
                                    name="origin_charges"
                                    placeholder="Origin"
                                    onChange={handleChange}
                                />
                                <Input
                                    name="destination_charges"
                                    placeholder="Destination"
                                    onChange={handleChange}
                                />
                                <Input
                                    name="transit_time"
                                    placeholder="Transit Time"
                                    onChange={handleChange}
                                />
                                <Input
                                    name="validity_period"
                                    type="datetime-local"
                                    onChange={handleChange}
                                />
                            </div>

                            <Button className="w-full" onClick={handleBid}>
                                Submit Bid
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
