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

    const [extensionEndTime, setExtensionEndTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [auctionStatus, setAuctionStatus] = useState("active");

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
        if (!role) return router.push("/login");
        if (role !== "supplier" && role !== "buyer") return router.push("/");
    }, [role, router]);

    // 🔁 FETCH DATA
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const res = await api.get(`/auction/${id}`);
                const data = res.data;

                if (data.rfq) {
                    setRfq(data.rfq);
                    setBids(data.rfq.bids || []);
                    setAuctionStatus(
                        data.rfq.status === 2
                            ? "forced"
                            : data.rfq.status === 0
                              ? "closed"
                              : "active",
                    );
                    if (data.rfq.current_end_time) {
                        setExtensionEndTime(
                            new Date(data.rfq.current_end_time),
                        );
                    }
                    if (typeof data.rfq.time_remaining === "number") {
                        setTimeLeft(
                            Math.max(0, data.rfq.time_remaining * 1000),
                        );
                    }

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

        fetchData();
    }, [id]);

    // ⏱ TIMER (EXTENSION WINDOW)
    useEffect(() => {
        if (!extensionEndTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = extensionEndTime - now;

            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [extensionEndTime]);

    // ⏱ FORMAT TIME
    const formatTime = (ms) => {
        if (ms <= 0) return "Auction Closed";

        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes} minutes ${seconds} seconds`;
    };

    // 🔌 WEBSOCKET
    useEffect(() => {
        if (!id || (role !== "supplier" && role !== "buyer")) return;

        const wsBase = process.env.BACKEND_WS || "ws://127.0.0.1:8000";
        const ws = new WebSocket(`${wsBase}/auction/ws/${id}`);
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

            // 🏆 BID UPDATE
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

            // ⏱ RESET TIMER FROM BACKEND
            if (data.type === "TIME_UPDATE") {
                if (data.current_end_time) {
                    setExtensionEndTime(new Date(data.current_end_time));
                }
                if (typeof data.time_remaining === "number") {
                    setTimeLeft(Math.max(0, data.time_remaining * 1000));
                }
                if (data.status) {
                    setAuctionStatus(data.status);
                }
            }
        };

        return () => ws.close();
    }, [id, role]);

    // ✍️ HANDLE INPUT
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]:
                name === "validity_period"
                    ? value
                    : value === ""
                      ? ""
                      : Number(value),
        });
    };

    // 💰 SEND BID
    const handleBid = () => {
        if (!wsRef.current || wsRef.current.readyState !== 1) return;
        if (!canBid) return;

        if (
            form.freight_charges === "" ||
            form.origin_charges === "" ||
            form.destination_charges === ""
        ) {
            alert("Please fill all required charges");
            return;
        }

        const bid_amount =
            form.freight_charges +
            form.origin_charges +
            form.destination_charges;

        wsRef.current.send(
            JSON.stringify({
                type: "BID",
                token: Cookies.get("token"),
                ...form,
                bid_amount,
                auction_id: id,
            }),
        );
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!rfq) return <div className="p-6">Auction not found</div>;

    const isDanger = timeLeft < 30000 && timeLeft > 0;
    const canBid = role === "supplier" && auctionStatus === "active";

    return (
        <div className="p-6 space-y-6">
            {/* ⏱ TIMER */}
            <Card className="border-blue-500">
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Final Closing Time
                        </p>
                        <p className="font-semibold">
                            {new Date(rfq.forced_close_time).toLocaleString()}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                            Extension Window Remaining
                        </p>
                        <p
                            className={`text-xl font-bold ${
                                isDanger
                                    ? "text-red-600 animate-pulse"
                                    : "text-blue-600"
                            }`}
                        >
                            {formatTime(timeLeft)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* MAIN */}
            <div className="flex gap-6">
                {/* LEFT */}
                <div className="w-1/2 space-y-6">
                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <h2 className="text-xl font-semibold">
                                {rfq.rfq_name}
                            </h2>

                            {Object.entries(rfq).map(([key, value]) => {
                                if (key === "bids") return null;

                                return (
                                    <p key={key}>
                                        <b>{key.replaceAll("_", " ")}:</b>{" "}
                                        {typeof value === "string" &&
                                        !isNaN(Date.parse(value))
                                            ? new Date(value).toLocaleString()
                                            : String(value)}
                                    </p>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* FORM */}
                    {role === "supplier" && (
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold">
                                    Submit Your Bid
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="number"
                                        name="freight_charges"
                                        placeholder="Freight Charges"
                                        onChange={handleChange}
                                    />
                                    <Input
                                        type="number"
                                        name="origin_charges"
                                        placeholder="Origin Charges"
                                        onChange={handleChange}
                                    />
                                    <Input
                                        type="number"
                                        name="destination_charges"
                                        placeholder="Destination Charges"
                                        onChange={handleChange}
                                    />
                                    <Input
                                        type="number"
                                        name="transit_time"
                                        placeholder="Transit Time"
                                        onChange={handleChange}
                                    />
                                    <Input
                                        type="datetime-local"
                                        name="validity_period"
                                        onChange={handleChange}
                                    />
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleBid}
                                    disabled={!canBid}
                                >
                                    Submit Bid
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* RIGHT */}
                <div className="w-1/2 space-y-4">
                    {bestBid && (
                        <Card className="border-green-500">
                            <CardContent className="p-4">
                                <h3 className="text-green-600 font-semibold">
                                    Best Bid
                                </h3>
                                <p>{bestBid.owner_email}</p>
                                <p className="text-lg font-bold">
                                    ₹{bestBid.bid_amount}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {bids.map((b, idx) => (
                            <Card key={idx}>
                                <CardContent className="p-3 text-sm space-y-1">
                                    <p className="font-medium">
                                        {b.owner_email}
                                    </p>
                                    <p>₹{b.bid_amount}</p>
                                    <p>Freight Charges: {b.freight_charges}</p>
                                    <p>Origin Charges: {b.origin_charges}</p>
                                    <p>
                                        Destination Charges:{" "}
                                        {b.destination_charges}
                                    </p>
                                    <p>Transit Time: {b.transit_time}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
