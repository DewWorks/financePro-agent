"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatorTool = void 0;
const adk_1 = require("@google/adk");
const zod_1 = require("zod");
exports.calculatorTool = new adk_1.FunctionTool({
    name: 'calculator',
    description: 'Perform basic mathematical operations (add, subtract, multiply, divide) to ensure accuracy.',
    parameters: zod_1.z.object({
        operation: zod_1.z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The operation to perform'),
        a: zod_1.z.number().describe('The first number'),
        b: zod_1.z.number().describe('The second number'),
    }),
    execute: async ({ operation, a, b }) => {
        switch (operation) {
            case 'add':
                return { result: a + b };
            case 'subtract':
                return { result: a - b };
            case 'multiply':
                return { result: a * b };
            case 'divide':
                if (b === 0)
                    throw new Error('Cannot divide by zero');
                return { result: a / b };
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    },
});
//# sourceMappingURL=calculator.tool.js.map