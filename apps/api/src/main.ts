import "reflect-metadata";
import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function buildCorsOrigins(): string[] {
  const raw = process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN;
  if (!raw || raw.trim() === "") {
    return [];
  }
  if (raw.trim() === "*") {
    return ["*"];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = buildCorsOrigins();
  if (origins.length > 0) {
    app.enableCors({
      origin: origins.length === 1 && origins[0] === "*" ? true : origins,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });
    // eslint-disable-next-line no-console
    console.log(`[RestoCash API] CORS enabled for origins: ${origins.join(", ")}`);
  } else {
    // eslint-disable-next-line no-console
    console.log("[RestoCash API] CORS disabled (no WEB_ORIGIN env var set)");
  }

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
