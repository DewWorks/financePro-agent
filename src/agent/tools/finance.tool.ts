
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * MOCK DATABASE STATE
 * In a real app, this would be a database connection.
 */
let MOCK_BALANCE = 1500.00;
const MOCK_TRANSACTIONS = [
    { id: 1, type: 'expense', amount: 50, category: 'Food', date: '2023-10-26' },
    { id: 2, type: 'income', amount: 3000, category: 'Salary', date: '2023-10-01' }
];

export const getUserBalanceTool = new FunctionTool({
    name: 'getUserBalance',
    description: 'Get the current balance of the user\'s account. Use this whenever the user asks about their money or affordability.',
    parameters: z.object({}),
    execute: async () => {
        return { balance: MOCK_BALANCE, currency: 'BRL' };
    },
});

export const addTransactionTool = new FunctionTool({
    name: 'addTransaction',
    description: 'Record a new expense or income transaction. Use this when the user says they spent or received money.',
    parameters: z.object({
        type: z.enum(['expense', 'income']).describe('The type of transaction.'),
        amount: z.number().describe('The monetary amount.'),
        category: z.string().describe('The category (e.g., Food, Transport, Salary).'),
        description: z.string().optional().describe('Optional description of the transaction.'),
    }),
    execute: async ({ type, amount, category, description }) => {
        const newTx = {
            id: MOCK_TRANSACTIONS.length + 1,
            type,
            amount,
            category,
            description: description || '',
            date: new Date().toISOString().split('T')[0]
        };

        // Update mock state
        if (type === 'expense') {
            MOCK_BALANCE -= amount;
        } else {
            MOCK_BALANCE += amount;
        }
        MOCK_TRANSACTIONS.push(newTx);

        return {
            status: 'success',
            message: 'Transaction recorded successfully.',
            newBalance: MOCK_BALANCE,
            transactionId: newTx.id
        };
    },
});

export const getInvestmentOptionsTool = new FunctionTool({
    name: 'getInvestmentOptions',
    description: 'Get a list of available investment options based on risk profile.',
    parameters: z.object({
        riskProfile: z.enum(['conservative', 'moderate', 'aggressive']).describe('The user risk profile.'),
    }),
    execute: async ({ riskProfile }) => {
        const options = {
            conservative: [
                { name: 'Tesouro Selic', return: '10.75% a.a', risk: 'Low' },
                { name: 'CDB Liquidez Diária', return: '100% CDI', risk: 'Low' }
            ],
            moderate: [
                { name: 'Fundo Multimercado', return: '12-15% a.a', risk: 'Medium' },
                { name: 'FIIs (Fundos Imobiliários)', return: 'Variable + Dividends', risk: 'Medium' }
            ],
            aggressive: [
                { name: 'Ações (Stock Market)', return: 'Variable', risk: 'High' },
                { name: 'Crypto (Bitcoin)', return: 'High Volatility', risk: 'Very High' }
            ]
        };
        return { options: options[riskProfile] || options['conservative'] };
    },
});
