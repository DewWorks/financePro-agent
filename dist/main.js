"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.enableCors();
        app.useGlobalPipes(new common_1.ValidationPipe({ transform: true }));
        await app.listen(process.env.PORT ?? 3000);
        console.log(`Application is running on: ${await app.getUrl()}`);
    }
    catch (error) {
        console.error('Error during NestJS application startup:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map