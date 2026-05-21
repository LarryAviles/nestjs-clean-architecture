import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

class EnvSchema {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN!: string;

  @IsInt()
  @Min(1)
  PORT!: number;
}

/**
 * Validates `process.env` at boot. Failing fast here is cheaper than failing
 * deep inside a request once a missing config bites.
 */
export function validateEnv(raw: Record<string, unknown>): EnvSchema {
  const candidate = plainToInstance(EnvSchema, { ...raw, PORT: Number(raw.PORT ?? 3000) });
  const errors = validateSync(candidate, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.toString()}`);
  }
  return candidate;
}

export type AppEnv = EnvSchema;
