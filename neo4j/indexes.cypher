// Optional indexes for better query performance
CREATE INDEX user_name IF NOT EXISTS FOR (u:User) ON (u.name);
CREATE INDEX course_code IF NOT EXISTS FOR (c:Course) ON (c.code);
CREATE INDEX major_name IF NOT EXISTS FOR (m:Major) ON (m.name);
CREATE INDEX hobby_name IF NOT EXISTS FOR (h:Hobby) ON (h.name);
