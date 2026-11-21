"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";
import { apiFetch } from "@/lib/api-fetch";

type Props = {
    itemId: string;
    vendorId: string;
    price: number;
};

type OrderReceipt = {
    _id: string;
    orderDate: string;
    quantity: number;
    totalPrice: number;
};

function todayInBangladesh() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const part = (type: string) =>
        parts.find((entry) => entry.type === type)?.value ?? "";

    return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatPrice(amount: number) {
    return new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function OrderForm({ itemId, vendorId, price }: Props) {
    const router = useRouter();
    const {
        data: session,
        isPending,
        error: sessionError,
        refetch,
    } = authClient.useSession();

    const submittingRef = useRef(false);

    const [orderDate, setOrderDate] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [message, setMessage] = useState("");


    const user = session?.user;
    const quantityNumber = Number(quantity);
    const validQuantity =
        Number.isInteger(quantityNumber) &&
        quantityNumber >= 1 &&
        quantityNumber <= 20;

    const restriction = !user
        ? ""
        : user.isBlocked
            ? "Your account cannot place orders."
            : user.roleSelectionPending
                ? "Complete your account role selection before ordering."
                : user.role === "admin"
                    ? "Admin accounts cannot place customer orders."
                    : !["customer", "vendor"].includes(user.role ?? "")
                        ? "This account cannot place orders."
                        : user.id === vendorId
                            ? "You cannot order your own menu item."
                            : "";

    function showError(message: string) {
        setError(message);
        toast.error(message, { id: "order-validation" });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submittingRef.current || receipt) return;

        setError("");

        if (isPending || sessionError) {
            showError("Your account could not be verified. Please try again.");
            return;
        }

        if (!user) {
            toast.error("Please sign in to place an order.");
            router.replace("/sign-in");
            return;
        }

        if (restriction) {
            showError(restriction);
            return;
        }

        if (!orderDate || orderDate < todayInBangladesh()) {
            showError("Choose today or a future date.");
            return;
        }

        if (!validQuantity) {
            showError("Quantity must be a whole number between 1 and 20.");
            return;
        }
        const trimmedAddress = deliveryAddress.trim();
        const trimmedMessage = message.trim();

        if (trimmedAddress.length < 10 || trimmedAddress.length > 500) {
            showError("Enter a delivery address between 10 and 500 characters.");
            return;
        }

        if (trimmedMessage.length > 500) {
            showError("Your message must be 500 characters or fewer.");
            return;
        }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
            showError("The API URL is not configured.");
            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);

        const toastId = toast.loading("Placing your order...");

        try {
            let response: Response;

            try {
                response = await apiFetch(`${apiUrl}/api/orders`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        itemId,
                        orderDate,
                        quantity: quantityNumber,
                        deliveryAddress: trimmedAddress,
                        message: trimmedMessage,
                    }),
                    signal: AbortSignal.timeout(20_000),
                });
            } catch {
                throw new Error(
                    "We could not confirm your order because the connection failed or timed out. Retrying the same item and date will not create a duplicate active order."
                );
            }

            if (response.status === 401) {
                router.replace("/sign-in");
                throw new Error("Your session expired. Please sign in again.");
            }

            const result = await response.json().catch(() => null);

            if (!response.ok || result?.success !== true) {
                throw new Error(
                    result?.message || "Could not place your order. Please try again."
                );
            }

            if (
                typeof result.data?._id !== "string" ||
                typeof result.data?.orderDate !== "string" ||
                typeof result.data?.quantity !== "number" ||
                typeof result.data?.totalPrice !== "number"
            ) {
                throw new Error(
                    "The server response could not be read. Your order may have been saved."
                );
            }

            setReceipt(result.data);

            toast.success("Order placed! Waiting for vendor approval.", {
                id: toastId,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Could not place your order.";

            setError(message);
            toast.error(message, { id: toastId, duration: 7000 });
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }

    if (isPending) {
        return (
            <div role="status" className="mt-8 flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className="size-5 animate-spin rounded-full border-2 border-orange-200 border-t-red-700 motion-reduce:animate-none"
                />
                <p className="text-sm text-gray-600">Checking your account...</p>
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className="mt-8 rounded-xl bg-red-50 p-4">
                <p role="alert" className="text-sm text-red-700">
                    Unable to verify your account.
                </p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-2 font-semibold text-red-700 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <Link
                href="/sign-in"
                className="mt-8 block rounded-xl bg-red-700 px-5 py-3 text-center font-semibold text-white"
            >
                Sign in to order
            </Link>
        );
    }

    if (restriction) {
        return (
            <p className="mt-8 rounded-xl bg-orange-50 p-4 text-sm text-orange-900">
                {restriction}
            </p>
        );
    }

    if (receipt) {
        return (
            <div
                role="status"
                className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5"
            >
                <h2 className="text-lg font-bold text-green-900">
                    Order placed successfully
                </h2>

                <p className="mt-2 text-sm text-green-800">
                    Your order is pending vendor approval.
                </p>

                <dl className="mt-4 space-y-2 text-sm text-green-900">
                    <div>
                        <dt className="font-semibold">Order ID</dt>
                        <dd className="break-all">{receipt._id}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Delivery Date</dt>
                        <dd>{receipt.orderDate}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Quantity</dt>
                        <dd>{receipt.quantity}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Total</dt>
                        <dd>{formatPrice(receipt.totalPrice)}</dd>
                    </div>
                </dl>

                <Link
                    href="/menu"
                    className="mt-5 inline-block font-semibold text-green-900 underline"
                >
                    Continue browsing
                </Link>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-8 border-t border-gray-100 pt-6"
        >
            <h2 className="text-xl font-bold text-gray-900">Place your order</h2>

            <fieldset disabled={isSubmitting} className="mt-4 space-y-4">
                <div>
                    <label
                        htmlFor="order-date"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Delivery Date
                    </label>
                    <input
                        id="order-date"
                        type="date"
                        required
                        value={orderDate}
                        onChange={(event) => setOrderDate(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Choose today or a future date. Dates use Bangladesh time.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="order-quantity"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Quantity
                    </label>
                    <input
                        id="order-quantity"
                        type="number"
                        min={1}
                        max={20}
                        step={1}
                        required
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    />
                </div>
                <div>
                    <label
                        htmlFor="delivery-address"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Delivery address
                    </label>

                    <textarea
                        id="delivery-address"
                        name="deliveryAddress"
                        autoComplete="street-address"
                        required
                        minLength={10}
                        maxLength={500}
                        rows={3}
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        placeholder="House, road, area, city, and any useful landmark"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    />
                </div>

                <div>
                    <label
                        htmlFor="order-message"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Message to restaurant (optional)
                    </label>

                    <textarea
                        id="order-message"
                        name="message"
                        maxLength={500}
                        rows={3}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Add any special requests or delivery instructions"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                        Special requests are subject to restaurant availability.
                    </p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-orange-50 p-4">
                    <span className="font-medium text-gray-700">Estimated total</span>
                    <span className="text-xl font-bold text-red-700">
                        {validQuantity
                            ? formatPrice(
                                (Math.round(price * 100) * quantityNumber) / 100
                            )
                            : "—"}
                    </span>
                </div>

                <p className="text-xs text-gray-500">
                    The final total uses the current item price when you place the order.
                </p>

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting && (
                        <span
                            aria-hidden="true"
                            className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                        />
                    )}
                    {isSubmitting ? "Placing order..." : "Place Order"}
                </button>
            </fieldset>
        </form>
    );
}