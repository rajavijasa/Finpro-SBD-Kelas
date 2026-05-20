import { pgTable, serial, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";

// 1. Users Table (Core Auth & Profile settings)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 256 }).unique().notNull(),
  password: varchar('password', { length: 256 }).notNull(), // Hashed credentials
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 256 }),
  university: varchar('university', { length: 256 }),
  major: varchar('major', { length: 256 }),
  year: integer('year'),
  bio: text('bio'),
  gender: varchar('gender', { length: 50 }),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2. Swipes Table (Tinder gestures history)
export const swipes = pgTable('swipes', {
  id: serial('id').primaryKey(),
  swiperId: integer('swiper_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetId: integer('target_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  swipeType: varchar('swipe_type', { length: 50 }).notNull(), // 'like', 'nope', 'super'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 3. Messages Table (Real-time chat log)
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: integer('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 4. Majors Table (Academic focus normalization)
export const majors = pgTable('majors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).unique().notNull(),
  faculty: varchar('faculty', { length: 256 }).notNull(),
});

// 5. Courses Table (Class normalization)
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
});

// 6. Hobbies Table (Interest normalization)
export const hobbies = pgTable('hobbies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).unique().notNull(),
  category: varchar('category', { length: 256 }),
});

// 7. User Enrolled Courses Junction Table (TAKES equivalent in SQL)
export const userCourses = pgTable('user_courses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
});

// 8. User Liked Hobbies Junction Table (LIKES equivalent in SQL)
export const userHobbies = pgTable('user_hobbies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  hobbyId: integer('hobby_id').references(() => hobbies.id, { onDelete: 'cascade' }).notNull(),
});
