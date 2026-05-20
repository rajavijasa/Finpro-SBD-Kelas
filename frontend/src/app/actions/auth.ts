'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, users, userCourses, userHobbies, courses as coursesTable, hobbies as hobbiesTable, swipes } from '@/db';
import { eq, and } from 'drizzle-orm';
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

// 5. RECORD SWIPE ACTION (With Dual-Database Parity and Mutual Match Verification)
export async function recordSwipeAction(
  swiperName: string,
  targetName: string,
  swipeType: 'like' | 'nope' | 'super'
) {
  try {
    // 1. Resolve user IDs from PostgreSQL
    const swiperResult = await db.select().from(users).where(eq(users.fullName, swiperName)).limit(1);
    const targetResult = await db.select().from(users).where(eq(users.fullName, targetName)).limit(1);

    if (swiperResult.length === 0 || targetResult.length === 0) {
      return { error: 'Users not found.' };
    }

    const swiper = swiperResult[0];
    const target = targetResult[0];

    // Check if swipe already exists to avoid duplicate entries
    const existingSwipe = await db
      .select()
      .from(swipes)
      .where(and(eq(swipes.swiperId, swiper.id), eq(swipes.targetId, target.id)))
      .limit(1);

    if (existingSwipe.length === 0) {
      // A. Save Swipe to PostgreSQL Drizzle
      await db.insert(swipes).values({
        swiperId: swiper.id,
        targetId: target.id,
        swipeType,
      });

      // B. Save Swipe to Neo4j Graph DB as a relationship
      await runCypher(`
        MATCH (s1:Student {name: $swiperName})
        MATCH (s2:Student {name: $targetName})
        MERGE (s1)-[r:SWIPED]->(s2)
        SET r.type = $swipeType
      `, { swiperName, targetName, swipeType });
    }

    // 2. Check if this is a "Nope" (No match possible)
    if (swipeType === 'nope') {
      return { isMatch: false };
    }

    // 3. Check if the target has already swiped right/up on swiper
    const targetSwipe = await db
      .select()
      .from(swipes)
      .where(and(eq(swipes.swiperId, target.id), eq(swipes.targetId, swiper.id)))
      .limit(1);

    // Check if target swipe is 'like' or 'super'
    if (targetSwipe.length > 0) {
      const type = targetSwipe[0].swipeType;
      if (type === 'like' || type === 'super') {
        // Yes, it is a mutual match!
        // Sync mutual match to Neo4j as a MATCHES relationship (bi-directional as per rules)
        await runCypher(`
          MATCH (s1:Student {name: $swiperName})
          MATCH (s2:Student {name: $targetName})
          MERGE (s1)-[:MATCHES]->(s2)
          MERGE (s2)-[:MATCHES]->(s1)
        `, { swiperName, targetName });

        return { isMatch: true };
      }
    }

    return { isMatch: false };
  } catch (err) {
    console.error('recordSwipeAction Failed:', err);
    return { error: 'Failed to record swipe.' };
  }
}

// 6. FETCH SWIPE DECK ACTION (Unlimited, Relevance-Sorted, Already-Swiped Filtered)
export type SwipeDeckCandidate = {
  name: string;
  university: string;
  year: number;
  bio: string;
  gender: string;
  major: string;
  faculty: string;
  avatarUrl: string;
  relevanceScore: number;
  sharedCourses: string[];
  sharedHobbies: string[];
  mutualFriends: number;
};

export async function fetchSwipeDeckAction(swiperName: string): Promise<SwipeDeckCandidate[]> {
  try {
    // 1. Get swiper user ID
    const swiperResult = await db.select().from(users).where(eq(users.fullName, swiperName)).limit(1);
    if (swiperResult.length === 0) return [];
    const swiperId = swiperResult[0].id;

    // 2. Fetch all already-swiped target IDs from PostgreSQL
    const swipedRows = await db
      .select({ targetId: swipes.targetId })
      .from(swipes)
      .where(eq(swipes.swiperId, swiperId));
    const swipedTargetIds = new Set(swipedRows.map(r => r.targetId));

    // 3. Fetch all candidates with relevance scoring from Neo4j
    const result = await runCypher(`
      MATCH (me:Student|User {name: $swiperName})

      MATCH (other:Student|User)
      WHERE other <> me

      // Shared courses
      OPTIONAL MATCH (me)-[:TAKES]->(c:Course)<-[:TAKES]-(other)
      WITH me, other, collect(DISTINCT c.code) AS sharedCourseCodes

      // Shared hobbies
      OPTIONAL MATCH (me)-[:LIKES]->(h:Hobby)<-[:LIKES]-(other)
      WITH me, other, sharedCourseCodes, collect(DISTINCT h.name) AS sharedHobbyNames

      // Mutual friends
      OPTIONAL MATCH (me)-[:CONNECTED_WITH]-(f:Student|User)-[:CONNECTED_WITH]-(other)
      WITH other, sharedCourseCodes, sharedHobbyNames, count(DISTINCT f) AS mutualFriends

      // Major info
      OPTIONAL MATCH (other)-[:STUDIES]->(m:Major)

      WITH other, sharedCourseCodes, sharedHobbyNames, mutualFriends, m,
           size(sharedCourseCodes) + size(sharedHobbyNames) + mutualFriends AS relevanceScore

      RETURN
        other.name AS name,
        coalesce(other.university, 'Campus Circle University') AS university,
        coalesce(other.year, 2) AS year,
        coalesce(other.bio, 'Ready to spark campus connections!') AS bio,
        coalesce(other.gender, 'female') AS gender,
        coalesce(m.name, 'Information Systems') AS major,
        coalesce(m.faculty, 'Computing') AS faculty,
        relevanceScore,
        sharedCourseCodes,
        sharedHobbyNames,
        mutualFriends

      ORDER BY relevanceScore DESC, name ASC
    `, { swiperName });

    // 4. Build user ID lookup from PostgreSQL for filtering
    const allUsers = await db.select({ id: users.id, fullName: users.fullName, avatarUrl: users.avatarUrl }).from(users);
    const userIdByName = new Map(allUsers.map(u => [u.fullName, u.id]));
    const avatarByName = new Map(allUsers.map(u => [u.fullName, u.avatarUrl]));

    // 5. Map results, filtering out already-swiped users
    const candidates: SwipeDeckCandidate[] = [];
    for (const record of result.records) {
      const name = record.get('name') as string;
      const userId = userIdByName.get(name);
      if (!userId || swipedTargetIds.has(userId)) continue;
      if (name === swiperName) continue;

      const yearRaw = record.get('year');
      const yearNum = typeof yearRaw === 'object' && yearRaw !== null && 'toNumber' in yearRaw
        ? (yearRaw as any).toNumber() : Number(yearRaw) || 2;

      const relevanceRaw = record.get('relevanceScore');
      const relevanceNum = typeof relevanceRaw === 'object' && relevanceRaw !== null && 'toNumber' in relevanceRaw
        ? (relevanceRaw as any).toNumber() : Number(relevanceRaw) || 0;

      const mutualFriendsRaw = record.get('mutualFriends');
      const mutualFriendsNum = typeof mutualFriendsRaw === 'object' && mutualFriendsRaw !== null && 'toNumber' in mutualFriendsRaw
        ? (mutualFriendsRaw as any).toNumber() : Number(mutualFriendsRaw) || 0;

      candidates.push({
        name,
        university: record.get('university') as string,
        year: yearNum,
        bio: record.get('bio') as string,
        gender: record.get('gender') as string,
        major: record.get('major') as string,
        faculty: record.get('faculty') as string,
        avatarUrl: avatarByName.get(name) || getRandomPortrait(name),
        relevanceScore: relevanceNum,
        sharedCourses: (record.get('sharedCourseCodes') as string[]) || [],
        sharedHobbies: (record.get('sharedHobbyNames') as string[]) || [],
        mutualFriends: mutualFriendsNum,
      });
    }

    return candidates;
  } catch (err) {
    console.error('fetchSwipeDeckAction Failed:', err);
    return [];
  }
}

// 7. FETCH "WHO LIKED ME" DECK ACTION
export type LikedMeCandidate = {
  name: string;
  university: string;
  year: number;
  bio: string;
  gender: string;
  major: string;
  avatarUrl: string;
  swipeType: string;
};

export async function fetchLikedMeDeckAction(userName: string): Promise<LikedMeCandidate[]> {
  try {
    // 1. Get current user ID
    const userResult = await db.select().from(users).where(eq(users.fullName, userName)).limit(1);
    if (userResult.length === 0) return [];
    const userId = userResult[0].id;

    // 2. Get IDs user has already swiped on
    const swipedRows = await db
      .select({ targetId: swipes.targetId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));
    const swipedTargetIds = new Set(swipedRows.map(r => r.targetId));

    // 3. Find all users who liked/super-liked the current user
    const likedMeRows = await db
      .select({
        swiperId: swipes.swiperId,
        swipeType: swipes.swipeType,
      })
      .from(swipes)
      .where(and(eq(swipes.targetId, userId)));

    // 4. Filter to only like/super and exclude already-swiped-back users
    const likerIds: { id: number; swipeType: string }[] = [];
    for (const row of likedMeRows) {
      if ((row.swipeType === 'like' || row.swipeType === 'super') && !swipedTargetIds.has(row.swiperId)) {
        likerIds.push({ id: row.swiperId, swipeType: row.swipeType });
      }
    }

    if (likerIds.length === 0) return [];

    // 5. Get full profile data for each liker
    const allUsers = await db.select().from(users);
    const userById = new Map(allUsers.map(u => [u.id, u]));

    const candidates: LikedMeCandidate[] = [];
    for (const liker of likerIds) {
      const profile = userById.get(liker.id);
      if (!profile || profile.fullName === userName) continue;

      candidates.push({
        name: profile.fullName,
        university: profile.university || 'Campus Circle University',
        year: profile.year || 2,
        bio: profile.bio || 'Ready to spark campus connections!',
        gender: profile.gender || 'female',
        major: profile.major || 'Information Systems',
        avatarUrl: profile.avatarUrl || getRandomPortrait(profile.fullName),
        swipeType: liker.swipeType,
      });
    }

    return candidates;
  } catch (err) {
    console.error('fetchLikedMeDeckAction Failed:', err);
    return [];
  }
}
