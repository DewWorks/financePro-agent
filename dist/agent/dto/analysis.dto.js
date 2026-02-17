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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisResponseDto = exports.ForecastDto = exports.InsightDto = exports.AnalysisRequestDto = exports.FinancialContextDto = exports.UserProfileDto = exports.GoalDto = exports.TransactionDto = exports.RiskProfile = exports.AnalysisPeriod = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var AnalysisPeriod;
(function (AnalysisPeriod) {
    AnalysisPeriod["CURRENT_MONTH"] = "current_month";
    AnalysisPeriod["LAST_90_DAYS"] = "last_90_days";
})(AnalysisPeriod || (exports.AnalysisPeriod = AnalysisPeriod = {}));
var RiskProfile;
(function (RiskProfile) {
    RiskProfile["CONSERVATIVE"] = "conservative";
    RiskProfile["MODERATE"] = "moderate";
    RiskProfile["AGGRESSIVE"] = "aggressive";
})(RiskProfile || (exports.RiskProfile = RiskProfile = {}));
class TransactionDto {
    description;
    amount;
    date;
    category;
}
exports.TransactionDto = TransactionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionDto.prototype, "category", void 0);
class GoalDto {
    name;
    currentAmount;
    targetAmount;
    deadline;
}
exports.GoalDto = GoalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GoalDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GoalDto.prototype, "currentAmount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GoalDto.prototype, "targetAmount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GoalDto.prototype, "deadline", void 0);
class UserProfileDto {
    name;
    riskProfile;
    age;
}
exports.UserProfileDto = UserProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(RiskProfile),
    __metadata("design:type", String)
], UserProfileDto.prototype, "riskProfile", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UserProfileDto.prototype, "age", void 0);
class FinancialContextDto {
    transactions;
    activeGoals;
    monthlyIncome;
}
exports.FinancialContextDto = FinancialContextDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TransactionDto),
    __metadata("design:type", Array)
], FinancialContextDto.prototype, "transactions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GoalDto),
    __metadata("design:type", Array)
], FinancialContextDto.prototype, "activeGoals", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FinancialContextDto.prototype, "monthlyIncome", void 0);
class AnalysisRequestDto {
    period;
    userProfile;
    financialContext;
}
exports.AnalysisRequestDto = AnalysisRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(AnalysisPeriod),
    __metadata("design:type", String)
], AnalysisRequestDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UserProfileDto),
    __metadata("design:type", UserProfileDto)
], AnalysisRequestDto.prototype, "userProfile", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FinancialContextDto),
    __metadata("design:type", FinancialContextDto)
], AnalysisRequestDto.prototype, "financialContext", void 0);
class InsightDto {
    type;
    message;
    actionableStep;
}
exports.InsightDto = InsightDto;
__decorate([
    (0, class_validator_1.IsEnum)(['spending_spike', 'goal_risk', 'saving_opportunity']),
    __metadata("design:type", String)
], InsightDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsightDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsightDto.prototype, "actionableStep", void 0);
class ForecastDto {
    endOfMonthBalanceEstimate;
}
exports.ForecastDto = ForecastDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ForecastDto.prototype, "endOfMonthBalanceEstimate", void 0);
class AnalysisResponseDto {
    sentiment;
    summary;
    insights;
    forecast;
}
exports.AnalysisResponseDto = AnalysisResponseDto;
__decorate([
    (0, class_validator_1.IsEnum)(['positive', 'warning', 'critical']),
    __metadata("design:type", String)
], AnalysisResponseDto.prototype, "sentiment", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalysisResponseDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InsightDto),
    __metadata("design:type", Array)
], AnalysisResponseDto.prototype, "insights", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ForecastDto),
    __metadata("design:type", ForecastDto)
], AnalysisResponseDto.prototype, "forecast", void 0);
//# sourceMappingURL=analysis.dto.js.map