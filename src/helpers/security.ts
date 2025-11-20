export const MAX_ITEMS = 1000;

export function checkArrayMaxItems(array: any[]): boolean {
    if (Array.isArray(array) && array.length > MAX_ITEMS) {
        return false;
    }
    return true;
}
