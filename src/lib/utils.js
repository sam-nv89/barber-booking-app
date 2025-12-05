import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
