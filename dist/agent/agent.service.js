"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adk_1 = require("@google/adk");
const calculator_tool_1 = require("./tools/calculator.tool");
let AgentService = AgentService_1 = class AgentService {
    configService;
    logger = new common_1.Logger(AgentService_1.name);
    agent;
    model;
    runner;
    MODELS = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-001',
        'gemini-2.0-flash-lite-001',
        'gemini-2.5-pro',
        'gemini-1.5-flash'
    ];
    currentModelIndex = 0;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.initializeAgent();
    }
    initializeAgent() {
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is missing!');
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }
        const modelName = this.MODELS[this.currentModelIndex];
        this.logger.log(`Initializing AgentService with model: ${modelName}`);
        try {
            this.model = new adk_1.Gemini({
                model: modelName,
                apiKey: apiKey,
            });
            this.agent = new adk_1.LlmAgent({
                name: 'financeExpert',
                model: this.model,
                instruction: `You are a senior financial analyst and expert consultant for FinanceApp.
            Your goal is to provide pragmatic, safe, and personalized financial advice.
            
            PRINCIPLES:
            1. DO NOT JUDGE: Be empathetic but firm about financial goals.
            2. SAFETY FIRST: Never recommend high-risk investments without clear warnings.
            3. GOAL ORIENTED: Always relate current spending to future goals.
            4. ACCURACY: Use the calculator tool for ANY mathematical operation. Do not calculate mentally.
            
            When analyzing data, look for patterns, spending spikes, and opportunities to save.
            Structure your response in JSON format matching the AnalysisResponse schema when requested.`,
                tools: [calculator_tool_1.calculatorTool],
            });
            this.runner = new adk_1.InMemoryRunner({
                agent: this.agent,
                appName: 'finance-agent',
            });
            this.logger.log(`Agent initialized successfully with ${modelName}`);
        }
        catch (e) {
            this.logger.error(`Failed to initialize agent with ${modelName}:`, e);
        }
    }
    switchToNextModel() {
        if (this.currentModelIndex < this.MODELS.length - 1) {
            this.currentModelIndex++;
            this.logger.warn(`Switching to fallback model: ${this.MODELS[this.currentModelIndex]}`);
            this.initializeAgent();
            return true;
        }
        this.logger.error('All fallback models exhausted.');
        return false;
    }
    async analyze(request) {
        const context = JSON.stringify({
            userProfile: request.userProfile,
            financialContext: request.financialContext,
            period: request.period,
        });
        const prompt = `Perform a deep financial analysis for this user.
    Context: ${context}
    
    Output strictly in valid JSON format matching this structure (do not include markdown code blocks):
    {
      "sentiment": "positive" | "warning" | "critical",
      "summary": "string",
      "insights": [{ "type": "spending_spike" | "goal_risk" | "saving_opportunity", "message": "string", "actionableStep": "string" }],
      "forecast": { "endOfMonthBalanceEstimate": number }
    }`;
        const sessionId = `analysis-${Date.now()}`;
        return this.runAgent(sessionId, prompt);
    }
    async chat(request) {
        const contextSnapshot = request.contextSnapshot ? `Context Snapshot: ${JSON.stringify(request.contextSnapshot)}` : '';
        const message = `${contextSnapshot}\nUser: ${request.message}`;
        const response = await this.runAgent(request.sessionId, message);
        return { text: typeof response === 'string' ? response : JSON.stringify(response) };
    }
    async runAgent(sessionId, prompt, retryCount = 0) {
        const modelName = this.MODELS[this.currentModelIndex];
        this.logger.log(`Running agent | Session: ${sessionId} | Model: ${modelName} | Attempt: ${retryCount + 1}`);
        try {
            const appName = 'finance-agent';
            const userId = 'user';
            let session = await this.runner.sessionService.getSession({
                appName,
                userId,
                sessionId
            });
            if (!session) {
                this.logger.log(`Creating new session: ${sessionId}`);
                session = await this.runner.sessionService.createSession({
                    appName,
                    userId,
                    sessionId
                });
            }
        }
        catch (e) {
            this.logger.error(`Error managing session ${sessionId}`, e);
        }
        const newMessage = {
            role: 'user',
            parts: [{ text: prompt }],
        };
        try {
            const iterator = this.runner.runAsync({
                userId: 'user',
                sessionId,
                newMessage,
            });
            let lastText = '';
            let hadError = false;
            for await (const event of iterator) {
                this.logger.warn(`Received event: ${JSON.stringify(event)}`);
                const errorCode = event.errorCode;
                if (errorCode) {
                    this.logger.warn(`Encountered error code ${errorCode} with model ${modelName}`);
                    hadError = true;
                    break;
                }
                if (event.type === 'model_response') {
                    const response = event.response;
                    if (response && response.content && response.content.parts) {
                        const parts = response.content.parts;
                        if (Array.isArray(parts)) {
                            const textParts = parts.filter((p) => p.text).map((p) => p.text).join('');
                            if (textParts) {
                                lastText = textParts;
                            }
                        }
                    }
                }
            }
            if (hadError) {
                if (this.switchToNextModel()) {
                    this.logger.log(`Retrying request with new model...`);
                    return this.runAgent(sessionId, prompt, retryCount + 1);
                }
                else {
                    throw new Error(`All models failed. Last error with ${modelName}.`);
                }
            }
            if (!lastText) {
                this.logger.warn('Agent execution completed but no text response was captured.');
                if (retryCount < this.MODELS.length && this.switchToNextModel()) {
                    this.logger.warn('Empty response, trying fallback model...');
                    return this.runAgent(sessionId, prompt, retryCount + 1);
                }
                return "I'm sorry, I couldn't generate a response at this time.";
            }
            const trimmed = lastText.trim();
            const cleanText = trimmed.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            if ((cleanText.startsWith('{') && cleanText.endsWith('}')) || (cleanText.startsWith('[') && cleanText.endsWith(']'))) {
                try {
                    return JSON.parse(cleanText);
                }
                catch {
                    this.logger.warn('Failed to parse JSON response, returning raw text');
                }
            }
            return lastText;
        }
        catch (e) {
            this.logger.error(`Error running agent with ${modelName}:`, e);
            if (this.switchToNextModel()) {
                this.logger.log(`Exception caught. Retrying request with new model...`);
                return this.runAgent(sessionId, prompt, retryCount + 1);
            }
            throw new Error(`Agent execution failed after retries: ${e.message}`);
        }
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AgentService);
//# sourceMappingURL=agent.service.js.map