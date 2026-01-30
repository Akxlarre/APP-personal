import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class SQLiteService {
    private sqlite: SQLiteConnection;
    public db!: SQLiteDBConnection;
    private platform: string;

    constructor() {
        this.platform = Capacitor.getPlatform();
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    async init() {
        try {
            this.db = await this.sqlite.createConnection(
                'lifeblocks',
                false,
                'no-encryption',
                1,
                false
            );

            await this.db.open();
            await this.createTables();
            console.log('SQLite initialized successfully');
        } catch (err) {
            console.error('Error initializing SQLite', err);
        }
    }

    private async createTables() {
        const schema = `
      CREATE TABLE IF NOT EXISTS daily_blocks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        completion_note TEXT,
        completed_at TEXT,
        synced INTEGER DEFAULT 0,
        local_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        server_updated_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_blocks_date ON daily_blocks(date);
      CREATE INDEX IF NOT EXISTS idx_blocks_sync ON daily_blocks(synced);
      
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS streaks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        block_name TEXT NOT NULL,
        current_count INTEGER DEFAULT 0,
        longest_count INTEGER DEFAULT 0,
        last_completed DATE,
        freeze_count INTEGER DEFAULT 2,
        freeze_used_this_month INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habit_debt (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        block_id TEXT NOT NULL,
        block_name TEXT NOT NULL,
        original_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'pending',
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        block_name TEXT,
        earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );
    `;

        await this.db.execute(schema);
    }

    async getUnsyncedBlocks(): Promise<any[]> {
        const result = await this.db.query(
            'SELECT * FROM daily_blocks WHERE synced = 0'
        );
        return result.values || [];
    }

    async markAsSynced(blockId: string) {
        await this.db.run(
            'UPDATE daily_blocks SET synced = 1 WHERE id = ?',
            [blockId]
        );
    }
}
