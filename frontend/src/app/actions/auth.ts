'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, users, userCourses, userHobbies, courses as coursesTable, hobbies as hobbiesTable } from '@/db';
import { eq } from 'drizzle-orm';
import { runCypher } from '@/lib/neo4j';

// Deterministic Unsplash Stock Portraits
const PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600"
];

function getRandomPortrait(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PORTRAITS.length;
  return PORTRAITS[idx];
}

// 1. LOGIN ACTION
export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Please enter both username and password.' };
  }

  const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (user.length === 0) {
    return { error: 'Username not found.' };
  }

  const existingUser = user[0];
  if (existingUser.password !== password) {
    return { error: 'Incorrect password.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('session_user', existingUser.fullName, {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/');
}

// 2. REGISTER ACTION (With Multi-Relationship Graph Sync)
export async function registerAction(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const phone = formData.get('phone') as string;
  const university = formData.get('university') as string;
  const major = formData.get('major') as string;
  const year = parseInt(formData.get('year') as string) || 2;
  const gender = formData.get('gender') as string || 'female';
  const bio = formData.get('bio') as string || 'Ready to spark campus connections!';

  // Multi-select inputs from form checkbox groups
  const courses = formData.getAll('courses') as string[];
  const hobbies = formData.getAll('hobbies') as string[];

  if (!fullName || !username || !password || !major) {
    return { error: 'Please fill in all required fields.' };
  }

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    return { error: 'Username is already taken.' };
  }

  const avatarUrl = getRandomPortrait(fullName);

  // A. Save to PostgreSQL Supabase using Drizzle
  const insertedUser = await db.insert(users).values({
    username,
    password,
    fullName,
    phone,
    university,
    major,
    year,
    bio,
    gender,
    avatarUrl,
  }).returning({ id: users.id });

  const uId = insertedUser[0]?.id;
  if (uId) {
    const activeCourses = courses.length > 0 ? courses : ['DB210'];
    for (const courseCode of activeCourses) {
      const courseRec = await db.select().from(coursesTable).where(eq(coursesTable.code, courseCode)).limit(1);
      if (courseRec.length > 0) {
        await db.insert(userCourses).values({
          userId: uId,
          courseId: courseRec[0].id
        });
      }
    }

    const activeHobbies = hobbies.length > 0 ? hobbies : ['Gaming'];
    for (const hobbyName of activeHobbies) {
      const hobbyRec = await db.select().from(hobbiesTable).where(eq(hobbiesTable.name, hobbyName)).limit(1);
      if (hobbyRec.length > 0) {
        await db.insert(userHobbies).values({
          userId: uId,
          hobbyId: hobbyRec[0].id
        });
      }
    }
  }

  // B. Synchronize Node and All Core Relationships to Neo4j Aura DB
  try {
    await runCypher(`
      // Create student node
      CREATE (s:Student {name: $fullName, university: $university, year: $year, bio: $bio})
      
      // Match major and studies relationship
      WITH s
      MATCH (m:Major {name: $major})
      CREATE (s)-[:STUDIES]->(m)
      
      // Match courses and takes relationships
      WITH s
      UNWIND $courses AS courseCode
      MATCH (c:Course {code: courseCode})
      CREATE (s)-[:TAKES]->(c)
      
      // Match hobbies and likes relationships
      WITH s
      UNWIND $hobbies AS hobbyName
      MATCH (h:Hobby {name: hobbyName})
      CREATE (s)-[:LIKES]->(h)
    `, {
      fullName,
      university,
      year,
      bio,
      major,
      courses: courses.length > 0 ? courses : ['DB210'],
      hobbies: hobbies.length > 0 ? hobbies : ['Gaming']
    });
  } catch (err) {
    console.error('Neo4j Registration Sync Failed:', err);
  }

  const cookieStore = await cookies();
  cookieStore.set('session_user', fullName, {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/');
}

// 3. PROFILE UPDATE ACTION (Synchronized SQL + Graph Edit)
export async function updateProfileAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    return { error: 'Unauthorized session.' };
  }

  const phone = formData.get('phone') as string;
  const major = formData.get('major') as string;
  const year = parseInt(formData.get('year') as string) || 2;
  const bio = formData.get('bio') as string;
  const courses = formData.getAll('courses') as string[];
  const hobbies = formData.getAll('hobbies') as string[];

  // A. Update PostgreSQL Supabase profile record
  await db.update(users)
    .set({ phone, major, year, bio })
    .where(eq(users.fullName, sessionUser));

  // A2. Synchronize Courses & Hobbies relationship tables inside PostgreSQL
  try {
    const userRec = await db.select().from(users).where(eq(users.fullName, sessionUser)).limit(1);
    if (userRec.length > 0) {
      const uId = userRec[0].id;
      
      // Clear old entries
      await db.delete(userCourses).where(eq(userCourses.userId, uId));
      await db.delete(userHobbies).where(eq(userHobbies.userId, uId));
      
      // Insert new Courses
      if (courses.length > 0) {
        for (const courseCode of courses) {
          const courseRec = await db.select().from(coursesTable).where(eq(coursesTable.code, courseCode)).limit(1);
          if (courseRec.length > 0) {
            await db.insert(userCourses).values({
              userId: uId,
              courseId: courseRec[0].id
            });
          }
        }
      }
      
      // Insert new Hobbies
      if (hobbies.length > 0) {
        for (const hobbyName of hobbies) {
          const hobbyRec = await db.select().from(hobbiesTable).where(eq(hobbiesTable.name, hobbyName)).limit(1);
          if (hobbyRec.length > 0) {
            await db.insert(userHobbies).values({
              userId: uId,
              hobbyId: hobbyRec[0].id
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('PostgreSQL Relationships Update Sync Failed:', err);
  }

  // B. Update Neo4j Graph Database relationships and properties
  try {
    await runCypher(`
      // Find the Student node matching full name
      MATCH (s:Student {name: $sessionUser})
      SET s.year = $year, s.bio = $bio
      
      // Detach studies, takes, and likes relationships to clear out old records
      WITH s
      OPTIONAL MATCH (s)-[r:STUDIES|TAKES|LIKES]->()
      DELETE r
      
      // Re-map Major studies
      WITH s
      MATCH (m:Major {name: $major})
      CREATE (s)-[:STUDIES]->(m)
      
      // Re-map Courses takes
      WITH s
      UNWIND $courses AS courseCode
      MATCH (c:Course {code: courseCode})
      CREATE (s)-[:TAKES]->(c)
      
      // Re-map Hobbies likes
      WITH s
      UNWIND $hobbies AS hobbyName
      MATCH (h:Hobby {name: hobbyName})
      CREATE (s)-[:LIKES]->(h)
    `, {
      sessionUser,
      year,
      bio,
      major,
      courses: courses.length > 0 ? courses : ['DB210'],
      hobbies: hobbies.length > 0 ? hobbies : ['Gaming']
    });
  } catch (err) {
    console.error('Neo4j Profile Update Sync Failed:', err);
  }

  return { success: true };
}

// 4. LOGOUT ACTION
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session_user');
  redirect('/login');
}
