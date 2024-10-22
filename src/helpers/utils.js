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
    if (!(text.includes('{{') && text.includes('}}'))) return text;

    let newText = text;

    Object.keys(variables).forEach((key) => {
        newText = newText.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });

    if (newText.includes('{{') && newText.includes('}}')) {
        throw new Error(`Some variables were not replaced: ${newText}`);
    }

    return newText;
}

function mergeVariables(baseVariables, newVariables) {
    if (newVariables === null || typeof newVariables !== 'object') return baseVariables;
    Object.keys(newVariables).forEach((key) => {
        baseVariables[key] = newVariables[key];
    });
    return baseVariables;
}

function prepareLocalScript(script) {
    const localScript = script.replace(/return (.*);/, function (match, p1) {
        return `console.output(${p1});`;
    });
    return localScript;
}

module.exports = {
    pauseApp,
    replaceVariables,
    mergeVariables,
    prepareLocalScript
};
