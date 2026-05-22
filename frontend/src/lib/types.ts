export type UserSummary = {
  name: string;
  university?: string;
  year?: number;
};

export type CourseSummary = {
  subject?: string;
  code?: string;
  name?: string;
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

export type StudentProfile = {
  fullName: string;
  username: string;
  phone: string | null;
  university: string | null;
  major: string | null;
  year: number | null;
  bio: string | null;
  gender: string | null;
  avatarUrl: string | null;
  courses: string[];
  hobbies: string[];
  colorStyle: ColorStyle;
};

export interface CampusCircleCandidat {
  name: string;
  university: string;
  year: number;
  matchType: 'class' | 'fof' | 'hobby' | 'general';
  bio: string;
  gender: 'female' | 'male';
  major: string;
  faculty: string;
  colorStyle: ColorStyle;
  relevanceScore: number;
  avatarUrl?: string;
  details: {
    courses?: CourseSummary[];
    friends?: UserSummary[];
    hobby?: HobbySummary;
    sharedCourses?: string[];
    sharedHobbies?: string[];
    mutualFriends?: number;
  };
}

export type ColorStyle = {
  text: string;
  bg: string;
  dot: string;
};

export type RelationGraphData = {
  meMajor: MajorSummary | null;
  otherMajor: MajorSummary | null;
  sharedCourses: CourseSummary[];
  sharedHobbies: HobbySummary[];
  mutualFriends: UserSummary[];
};

export type SectionState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

export type ConnectStatus =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'matched' }
  | { status: 'error'; message: string };

export type Loadable<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: T | null; error: string };
