const MAX_ITEMS = 1000;

function checkArrayMaxItems(array) {
    if (Array.isArray(array) && array.length > MAX_ITEMS) {
        return false;
    }
    return true;
}

module.exports = {
    MAX_ITEMS,
    checkArrayMaxItems
};
