import 'server-only';

import neo4j from 'neo4j-driver';
import { runCypher } from './neo4j';
import { neo4jRecordToNative } from './neo4j-json';

export type UserSummary = {
  name: string;
  university?: string;
  year?: number;
};

export type CourseSummary = {
  subject?: string;
  code?: string;
};

export type MajorSummary = {
  name?: string;
  faculty?: string;
};

export type HobbySummary = {
  name?: string;
  category?: string;
};

export type MutualClassResult = {
  user: UserSummary;
  sharedCount: number;
  sharedCourses: CourseSummary[];
};

export type FofResult = {
  user: UserSummary;
  mutualCount: number;
  mutualFriends: UserSummary[];
};

export type HobbyClusterResult = {
  user: UserSummary;
  major: MajorSummary | null;
  hobby: HobbySummary;
};

export async function mutualClassFinder(input: {
  userName: string;
  limit?: number;
}): Promise<MutualClassResult[]> {
  const raw = input.limit;
  const normalized = typeof raw === 'number' && Number.isFinite(raw) ? raw : 10;
  const limit = Math.max(1, Math.min(50, normalized));

  const cypher = `
    MATCH (me:User|Student {name: $userName})
    WITH me, COUNT { (me)--() } AS meDegree
    ORDER BY meDegree DESC
    LIMIT 1

    MATCH (me)-[:TAKES]->(c:Course)<-[:TAKES]-(other:User|Student)
    WHERE other <> me
    WITH other,
      collect(DISTINCT c{.subject, .code}) AS sharedCourses,
      count(DISTINCT c) AS sharedCount
    RETURN other{.name, .university, .year} AS user, sharedCount, sharedCourses
    ORDER BY sharedCount DESC, user.name ASC
    LIMIT $limit
  `;

  const result = await runCypher(cypher, {
    userName: input.userName,
    limit: neo4j.int(limit),
  });
  return result.records.map((r: any) => {
    const user = neo4jRecordToNative<UserSummary>(r.get('user'));
    const sharedCount = neo4jRecordToNative<number>(r.get('sharedCount'));
    const sharedCourses = neo4jRecordToNative<CourseSummary[]>(r.get('sharedCourses'));
    return { user, sharedCount, sharedCourses };
  });
}

export async function friendOfFriendRecommendations(input: {
  userName: string;
  limit?: number;
}): Promise<FofResult[]> {
  const raw = input.limit;
  const normalized = typeof raw === 'number' && Number.isFinite(raw) ? raw : 10;
  const limit = Math.max(1, Math.min(50, normalized));

  const cypher = `
    MATCH (me:User|Student {name: $userName})
    WITH me, COUNT { (me)--() } AS meDegree
    ORDER BY meDegree DESC
    LIMIT 1

    MATCH (me)-[:CONNECTED_WITH]-(f:User|Student)-[:CONNECTED_WITH]-(candidate:User|Student)
    WHERE candidate <> me AND NOT (me)-[:CONNECTED_WITH]-(candidate)
    WITH candidate, collect(DISTINCT f{.name, .university, .year}) AS mutualFriends
    WITH candidate, mutualFriends, size(mutualFriends) AS mutualCount
    WHERE mutualCount >= 2
    RETURN candidate{.name, .university, .year} AS user, mutualCount, mutualFriends
    ORDER BY mutualCount DESC, user.name ASC
    LIMIT $limit
  `;

  const result = await runCypher(cypher, {
    userName: input.userName,
    limit: neo4j.int(limit),
  });
  return result.records.map((r: any) => {
    const user = neo4jRecordToNative<UserSummary>(r.get('user'));
    const mutualCount = neo4jRecordToNative<number>(r.get('mutualCount'));
    const mutualFriends = neo4jRecordToNative<UserSummary[]>(r.get('mutualFriends'));
    return { user, mutualCount, mutualFriends };
  });
}

export async function hobbyCluster(input: {
  userName: string;
  limit?: number;
}): Promise<HobbyClusterResult[]> {
  const raw = input.limit;
  const normalized = typeof raw === 'number' && Number.isFinite(raw) ? raw : 10;
  const limit = Math.max(1, Math.min(50, normalized));

  const cypher = `
    MATCH (me:User|Student {name: $userName})
    WITH me, COUNT { (me)--() } AS meDegree
    ORDER BY meDegree DESC
    LIMIT 1

    MATCH (me)-[:LIKES]->(h:Hobby)<-[:LIKES]-(other:User|Student)
    WHERE other <> me
    OPTIONAL MATCH (other)-[:STUDIES]->(otherMajor:Major)
    WITH other, otherMajor, h
    RETURN
      other{.name, .university, .year} AS user,
      CASE WHEN otherMajor IS NULL THEN NULL ELSE otherMajor{.name, .faculty} END AS major,
      h{.name, .category} AS hobby
    ORDER BY user.name ASC
    LIMIT $limit
  `;

  const result = await runCypher(cypher, {
    userName: input.userName,
    limit: neo4j.int(limit),
  });

  return result.records.map((r: any) => {
    const user = neo4jRecordToNative<UserSummary>(r.get('user'));
    const major = neo4jRecordToNative<MajorSummary | null>(r.get('major'));
    const hobby = neo4jRecordToNative<HobbySummary>(r.get('hobby'));
    return { user, major, hobby };
  });
}
