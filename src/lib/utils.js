import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length < 1) return value;

    // Check if it starts with 7 or 8 (KZ/RU)
    let clearNumber = phoneNumber;
    if (phoneNumber[0] === '7' || phoneNumber[0] === '8') {
        clearNumber = phoneNumber.substring(1);
    }

    const parts = [];
    if (clearNumber.length > 0) parts.push(clearNumber.substring(0, 3));
    if (clearNumber.length > 3) parts.push(clearNumber.substring(3, 6));
    if (clearNumber.length > 6) parts.push(clearNumber.substring(6, 8));
    if (clearNumber.length > 8) parts.push(clearNumber.substring(8, 10));

    return `+7 ${parts.join(' ')}`.trim();
};

export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
