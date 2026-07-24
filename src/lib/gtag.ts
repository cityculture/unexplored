declare global {
    interface Window {
        dataLayer: Record<string, unknown>[];
        gtag?: (...args: unknown[]) => void;
    }
}

interface WindowWithDataLayer extends Window {
    dataLayer: Record<string, unknown>[];
}

export const sendGAEvent = ({ action, category, label, value, ...rest }: {
    action: string;
    category: string;
    label?: string;
    value?: number;
    [key: string]: unknown;
}) => {
    const win = typeof window !== "undefined" ? (window as unknown as WindowWithDataLayer) : null;
    if (win && win.dataLayer) {
        win.dataLayer.push({
            event: action,
            event_category: category,
            event_label: label,
            value: value,
            ...rest
        });
    } else {
        console.log("GA4 Event:", { action, category, label, value, ...rest });
    }
};
