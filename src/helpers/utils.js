function pauseApp(milliseconds = 250) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('');
        }, milliseconds);
    });
}

function replaceVariables(text, variables) {
    if (!text) return text;
    if (!variables) return text;
    if (typeof variables !== 'object') return text;
    if (Object.keys(variables).length === 0) return text;

    let newText = text;
    Object.keys(variables).forEach((key) => {
        newText = newText.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });
    return newText;
}

function mergeVariables(baseVariables, newVariables) {
    let mergedVariables = { ...baseVariables };
    Object.keys(newVariables).forEach((key) => {
        mergedVariables[key] = newVariables[key];
    });
    baseVariables = mergedVariables;
    return baseVariables;
}

module.exports = {
    pauseApp,
    replaceVariables,
    mergeVariables
};
