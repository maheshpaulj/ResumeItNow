import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}
