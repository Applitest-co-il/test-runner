export function pauseApp(milliseconds: number = 250): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('');
        }, milliseconds);
    });
}

export function replaceVariables(text: string, variables: Record<string, any>): string {
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
        console.log(`Some variables were not replaced: ${newText}`);
    }

    return newText;
}

export function mergeVariables(
    baseVariables: Record<string, string>,
    newVariables: Record<string, string> | null
): Record<string, string> {
    if (newVariables === null) return baseVariables;
    Object.keys(newVariables).forEach((key) => {
        baseVariables[key] = newVariables[key];
    });
    return baseVariables;
}

export function prepareLocalScript(script: string): string {
    let localScript = script.replace(/return (.*);/, function (match, p1) {
        return `console.output(${p1});`;
    });
    return localScript;
}
