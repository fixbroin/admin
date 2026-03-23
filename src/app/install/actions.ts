
'use server';

import db from '@/lib/db';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function checkInstallationStatus() {
    try {
        const rows: any = await db.query('SELECT COUNT(*) as count FROM admin_users');
        return { isInstalled: rows[0].count > 0 };
    } catch (e) {
        return { isInstalled: false }; // Table might not exist yet
    }
}

export async function runInstallation(data: any) {
    const { dbConfig, adminUser } = data;
    
    try {
        // 1. Verify DB Connection
        const tempConn = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
        });

        // 2. Create DB if not exists
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await tempConn.end();

        // 3. Update .env (Note: This only works on VPS/Local, might be limited on some shared hosting)
        // We will try to append/update the .env file
        const envPath = path.join(process.cwd(), '.env');
        const newEnvContent = `
MYSQL_HOST=${dbConfig.host}
MYSQL_USER=${dbConfig.user}
MYSQL_PASSWORD=${dbConfig.password}
MYSQL_DATABASE=${dbConfig.database}
AUTH_SECRET=${crypto.randomBytes(32).toString('hex')}
NEXT_PUBLIC_APP_NAME=CineElite ADS
`;
        fs.writeFileSync(envPath, newEnvContent.trim());

        // 4. Initialize Tables (using our existing init-db logic but within this action)
        // We'll need a new connection since we just updated the database
        const pool = mysql.createPool({ ...dbConfig, multipleStatements: true });
        const conn = await pool.getConnection();

        const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await conn.query(schemaSql);

        // 5. Create Admin User
        const hashedPass = await bcrypt.hash(adminUser.password, 10);
        await conn.query(
            'INSERT INTO admin_users (id, username, password, email) VALUES (?, ?, ?, ?)',
            [uuidv4(), adminUser.username, hashedPass, adminUser.email]
        );

        conn.release();
        await pool.end();

        return { success: true };
    } catch (error: any) {
        console.error("Installation failed:", error);
        return { success: false, error: error.message };
    }
}
