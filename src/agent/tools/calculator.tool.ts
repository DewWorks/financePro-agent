
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const calculatorTool = new FunctionTool({
    name: 'calculator',
    description: 'Perform basic mathematical operations (add, subtract, multiply, divide) to ensure accuracy.',
    parameters: z.object({
        operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The operation to perform'),
        a: z.number().describe('The first number'),
        b: z.number().describe('The second number'),
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
                if (b === 0) throw new Error('Cannot divide by zero');
                return { result: a / b };
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    },
});
