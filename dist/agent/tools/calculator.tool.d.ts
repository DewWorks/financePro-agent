import { FunctionTool } from '@google/adk';
import { z } from 'zod';
export declare const calculatorTool: FunctionTool<z.ZodObject<{
    operation: z.ZodEnum<{
        add: "add";
        subtract: "subtract";
        multiply: "multiply";
        divide: "divide";
    }>;
    a: z.ZodNumber;
    b: z.ZodNumber;
}, z.core.$strip>>;
