export declare enum AnalysisPeriod {
    CURRENT_MONTH = "current_month",
    LAST_90_DAYS = "last_90_days"
}
export declare enum RiskProfile {
    CONSERVATIVE = "conservative",
    MODERATE = "moderate",
    AGGRESSIVE = "aggressive"
}
export declare class TransactionDto {
    description: string;
    amount: number;
    date: string;
    category: string;
}
export declare class GoalDto {
    name: string;
    currentAmount: number;
    targetAmount: number;
    deadline: string;
}
export declare class UserProfileDto {
    name: string;
    riskProfile: RiskProfile;
    age?: number;
}
export declare class FinancialContextDto {
    transactions: TransactionDto[];
    activeGoals: GoalDto[];
    monthlyIncome: number;
}
export declare class AnalysisRequestDto {
    period: AnalysisPeriod;
    userProfile: UserProfileDto;
    financialContext: FinancialContextDto;
}
export declare class InsightDto {
    type: 'spending_spike' | 'goal_risk' | 'saving_opportunity';
    message: string;
    actionableStep: string;
}
export declare class ForecastDto {
    endOfMonthBalanceEstimate: number;
}
export declare class AnalysisResponseDto {
    sentiment: 'positive' | 'warning' | 'critical';
    summary: string;
    insights: InsightDto[];
    forecast: ForecastDto;
}
