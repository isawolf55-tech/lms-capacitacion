import fs from 'fs';
import path from 'path';

export interface LMSConfig {
  minScore: number;
  maxAttempts: number;
  finalExamMinScore: number;
  finalExamMaxAttempts: number;
}

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

const DEFAULT_CONFIG: LMSConfig = {
  minScore: 80,
  maxAttempts: 3,
  finalExamMinScore: 80,
  finalExamMaxAttempts: 3,
};

export function getLMSConfig(): LMSConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      return DEFAULT_CONFIG;
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_CONFIG;
  }
}

export function saveLMSConfig(newConfig: Partial<LMSConfig>): LMSConfig {
  try {
    const current = getLMSConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    return DEFAULT_CONFIG;
  }
}
