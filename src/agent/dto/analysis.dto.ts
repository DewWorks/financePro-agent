
import { IsEnum, IsNumber, IsString, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum AnalysisPeriod {
    CURRENT_MONTH = 'current_month',
    LAST_90_DAYS = 'last_90_days',
}

export enum RiskProfile {
    CONSERVATIVE = 'conservative',
    MODERATE = 'moderate',
    AGGRESSIVE = 'aggressive',
}

export class TransactionDto {
    @IsString()
    description: string;

    @IsNumber()
    amount: number;

    @IsString()
    date: string;

    @IsString()
    category: string;
}

export class GoalDto {
    @IsString()
    name: string;

    @IsNumber()
    currentAmount: number;

    @IsNumber()
    targetAmount: number;

    @IsString()
    deadline: string;
}

export class UserProfileDto {
    @IsString()
    name: string;

    @IsEnum(RiskProfile)
    riskProfile: RiskProfile;

    @IsOptional()
    @IsNumber()
    age?: number;
}

export class FinancialContextDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransactionDto)
    transactions: TransactionDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GoalDto)
    activeGoals: GoalDto[];

    @IsNumber()
    monthlyIncome: number;
}

export class AnalysisRequestDto {
    @IsEnum(AnalysisPeriod)
    period: AnalysisPeriod;

    @ValidateNested()
    @Type(() => UserProfileDto)
    userProfile: UserProfileDto;

    @ValidateNested()
    @Type(() => FinancialContextDto)
    financialContext: FinancialContextDto;
}

export class InsightDto {
    @IsEnum(['spending_spike', 'goal_risk', 'saving_opportunity'])
    type: 'spending_spike' | 'goal_risk' | 'saving_opportunity';

    @IsString()
    message: string;

    @IsString()
    actionableStep: string;
}

export class ForecastDto {
    @IsNumber()
    endOfMonthBalanceEstimate: number;
}

export class AnalysisResponseDto {
    @IsEnum(['positive', 'warning', 'critical'])
    sentiment: 'positive' | 'warning' | 'critical';

    @IsString()
    summary: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InsightDto)
    insights: InsightDto[];

    @ValidateNested()
    @Type(() => ForecastDto)
    forecast: ForecastDto;
}
