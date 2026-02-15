import * as SQLite from 'expo-sqlite';
import { VOCABULARY } from '../assets/data/seedData';
import { calculateNextReview, SRS_STAGES } from '../utils/SRSLogic';
import { getCategoryForWord } from '../utils/CategoryMapper';

const DB_NAME = 'klea_language.db';

export interface Word {
    id: number;
    word: string;
    translation: string; // Storing as string for now to match current app structure
    difficulty_level: string; // 'A1', 'A2', etc.
    category_id?: number | null;
}

export interface Category {
    id: number;
    name: string;
    name_tr: string;
    word_count?: number;
}

export class DatabaseService {
    private static db: SQLite.SQLiteDatabase | null = null;

    static async getDB(): Promise<SQLite.SQLiteDatabase> {
        if (!this.db) {
            this.db = await SQLite.openDatabaseAsync(DB_NAME);
        }
        return this.db;
    }

    static async initDatabase() {
        const db = await this.getDB();

        await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_tr TEXT
      );

      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        translation TEXT NOT NULL,
        difficulty_level TEXT,
        category_id INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS user_word_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        last_reviewed_at DATETIME,
        next_review_at DATETIME,
        srs_stage INTEGER DEFAULT 0,
        FOREIGN KEY (word_id) REFERENCES words (id)
      );
    `);

        // Check if seeded
        const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM words');
        if (result && result.count === 0) {
            await this.seedDatabase(db);
        } else {
            // Check if categories are empty (migration for existing users)
            const catResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
            if (catResult && catResult.count === 0) {
                console.log("Migrating categories...");
                await this.seedCategories(db);
                await this.updateWordCategories(db);
            }
        }
    }

    private static async seedCategories(db: SQLite.SQLiteDatabase) {
        // We will insert categories dynamically based on what we find in the mapper or seedData?
        // Let's rely on the updateWordCategories to insert meaningful ones, 
        // OR insert all known categories first.
        // Let's insert all known categories from Mapper if we export them.
        // For now, let's just let updateWordCategories handle it or do it here.
        // Actually, seedDatabase uses them.
    }

    private static async updateWordCategories(db: SQLite.SQLiteDatabase) {
        console.log('Updating word categories...');
        const words = await db.getAllAsync<{ id: number, word: string }>('SELECT id, word FROM words');

        await db.withTransactionAsync(async () => {
            // Cache category IDs to avoid repeated selects
            const categoryCache = new Map<string, number>();

            // Helper to get/create category
            const getCategoryId = async (name: string, name_tr: string): Promise<number> => {
                const cached = categoryCache.get(name);
                if (cached !== undefined) return cached;

                const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [name]);
                if (existing) {
                    categoryCache.set(name, existing.id);
                    return existing.id;
                }

                const result = await db.runAsync('INSERT INTO categories (name, name_tr) VALUES (?, ?)', [name, name_tr]);
                categoryCache.set(name, result.lastInsertRowId);
                return result.lastInsertRowId;
            };

            for (const word of words) {
                const cat = getCategoryForWord(word.word);
                if (cat) {
                    const catId = await getCategoryId(cat.name, cat.name_tr);
                    await db.runAsync('UPDATE words SET category_id = ? WHERE id = ?', [catId, word.id]);
                }
            }
        });
        console.log('Categories updated.');
    }

    private static async seedDatabase(db: SQLite.SQLiteDatabase) {
        console.log('Seeding database...');
        await db.withTransactionAsync(async () => {
            // Cache category IDs
            const categoryCache = new Map<string, number>();

            const getCategoryId = async (name: string, name_tr: string): Promise<number> => {
                const cached = categoryCache.get(name);
                if (cached !== undefined) return cached;

                const result = await db.runAsync('INSERT INTO categories (name, name_tr) VALUES (?, ?)', [name, name_tr]);
                categoryCache.set(name, result.lastInsertRowId);
                return result.lastInsertRowId;
            };

            for (const item of VOCABULARY) {
                let catId: number | null = null;
                const cat = getCategoryForWord(item.en);
                if (cat) {
                    catId = await getCategoryId(cat.name, cat.name_tr);
                }

                await db.runAsync(
                    'INSERT INTO words (word, translation, difficulty_level, category_id) VALUES (?, ?, ?, ?)',
                    [item.en, item.tr, item.level, catId ?? null]
                );
            }
        });
        console.log('Database seeded successfully.');
    }

    static async getWordsByLevel(level: string): Promise<Word[]> {
        const db = await this.getDB();
        return await db.getAllAsync<Word>('SELECT * FROM words WHERE difficulty_level = ?', [level]);
    }

    static async getAllWords(): Promise<Word[]> {
        const db = await this.getDB();
        return await db.getAllAsync<Word>('SELECT * FROM words');
    }

    static async getRandomWords(limit: number = 10): Promise<Word[]> {
        const db = await this.getDB();
        return await db.getAllAsync<Word>(`SELECT * FROM words ORDER BY RANDOM() LIMIT ?`, [limit]);
    }

    // SRS Methods
    static async getDueWords(level: string, limit: number = 10, categoryId?: number): Promise<Word[]> {
        const db = await this.getDB();
        const now = new Date().toISOString();

        // Base query
        let query = `
            SELECT w.* 
            FROM words w
            LEFT JOIN user_word_stats s ON w.id = s.word_id
            WHERE w.difficulty_level = ?
        `;
        const params: (string | number)[] = [level];

        if (categoryId) {
            query += ` AND w.category_id = ? `;
            params.push(categoryId);
        }

        query += `
            AND (s.next_review_at IS NULL OR s.next_review_at <= ?)
            ORDER BY s.next_review_at ASC
            LIMIT ?
        `;
        params.push(now, limit);

        return await db.getAllAsync<Word>(query, params);
    }

    static async getAllCategories(): Promise<Category[]> {
        const db = await this.getDB();
        // Get categories with word counts
        return await db.getAllAsync<Category>(`
            SELECT c.*, COUNT(w.id) as word_count 
            FROM categories c
            LEFT JOIN words w ON c.id = w.category_id
            GROUP BY c.id
            ORDER BY c.name
        `);
    }

    static async markWordResult(wordId: number, isCorrect: boolean) {
        const db = await this.getDB();
        const now = new Date().toISOString();

        // Get current stats
        const currentStats = await db.getFirstAsync<{
            id: number, srs_stage: number, correct_count: number, incorrect_count: number
        }>(
            'SELECT * FROM user_word_stats WHERE word_id = ?',
            [wordId]
        );

        let stage = 0;
        let correct = 0;
        let incorrect = 0;

        if (currentStats) {
            stage = currentStats.srs_stage;
            correct = currentStats.correct_count;
            incorrect = currentStats.incorrect_count;
        }

        // Calculate next
        const { nextReview, nextStage } = calculateNextReview(stage, isCorrect);

        if (isCorrect) correct++;
        else incorrect++;

        const nextReviewIso = nextReview.toISOString();

        if (currentStats) {
            await db.runAsync(
                `UPDATE user_word_stats 
                SET correct_count = ?, incorrect_count = ?, last_reviewed_at = ?, next_review_at = ?, srs_stage = ?
                WHERE id = ?`,
                [correct, incorrect, now, nextReviewIso, nextStage, currentStats.id]
            );
        } else {
            await db.runAsync(
                `INSERT INTO user_word_stats (word_id, correct_count, incorrect_count, last_reviewed_at, next_review_at, srs_stage)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [wordId, correct, incorrect, now, nextReviewIso, nextStage] // wordId matches ?
            );
        }
    }
}
