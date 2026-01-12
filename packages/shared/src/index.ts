export function formatPrice(amount: number, currency: "USD" | "PAB" = "USD") {
    return new Intl.NumberFormat("es-PA", { style: "currency",  currency }).format(amount);
}
