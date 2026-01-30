import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class SQLiteService {
    private sqlite!: SQLiteConnection;
    public db!: SQLiteDBConnection;
    private platform: string;

    constructor() {
        this.platform = Capacitor.getPlatform();
    }

    async init() {
        if (this.platform === 'web') {
            return;
        }
        try {
            this.sqlite = new SQLiteConnection(CapacitorSQLite);
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
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        description TEXT,
        is_critical INTEGER DEFAULT 0,
        is_shared INTEGER DEFAULT 0,
        category TEXT DEFAULT 'work',
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates(id)
      );
      CREATE INDEX IF NOT EXISTS idx_blocks_template ON blocks(template_id);

      CREATE TABLE IF NOT EXISTS daily_schedule (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        template_id TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates(id)
      );
      CREATE INDEX IF NOT EXISTS idx_daily_schedule_user_date ON daily_schedule(user_id, date);

      CREATE TABLE IF NOT EXISTS daily_blocks (
        id TEXT PRIMARY KEY,
        schedule_id TEXT,
        original_block_id TEXT,
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
      CREATE INDEX IF NOT EXISTS idx_blocks_schedule ON daily_blocks(schedule_id);
      
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

      CREATE TABLE IF NOT EXISTS shared_blocks (
        id TEXT PRIMARY KEY,
        block_id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        invited_user_id TEXT NOT NULL,
        role TEXT,
        status TEXT DEFAULT 'pending',
        confirmed_attendance INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_shared_blocks_invited ON shared_blocks(invited_user_id);

      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_items(user_id);

      CREATE TABLE IF NOT EXISTS meal_suggestions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        required_items TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS turn_schedule (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        partner_id TEXT NOT NULL,
        week_start TEXT NOT NULL,
        turn_type TEXT NOT NULL,
        exceptions TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_turn_schedule_user ON turn_schedule(user_id);
    `;

        await this.db.execute(schema);
        await this.migrateDailyBlocksAddScheduleColumns();
    }

    private async migrateDailyBlocksAddScheduleColumns(): Promise<void> {
        const columns = ['schedule_id', 'original_block_id'];
        for (const col of columns) {
            try {
                await this.db.run(`ALTER TABLE daily_blocks ADD COLUMN ${col} TEXT`);
            } catch {
                // Column already exists
            }
        }
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
