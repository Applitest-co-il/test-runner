const BaseStep = require('./base-step');

class VariableClearStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(__, _) {
        const varName = this.value;
        if (this.variables[varName]) {
            delete this.variables[varName];
        }
    }
}

module.exports = VariableClearStep;
