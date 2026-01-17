import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  imageKey: text('image_key').notNull(),
  species: text('species').notNull(),
  commonName: text('common_name').notNull(),
  isSafeToEat: boolean('is_safe_to_eat').notNull(),
  isSafeToTouch: boolean('is_safe_to_touch').notNull(),
  confidence: text('confidence', { enum: ['high', 'medium', 'low'] }).notNull(),
  warnings: text('warnings').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('scans_user_id_idx').on(table.userId),
  index('scans_created_at_idx').on(table.createdAt),
]);
