// Demo dataset for CampusCircle
// Labels: User, Course, Major, Hobby
// Relationships: CONNECTED_WITH, TAKES, STUDIES, LIKES

// --- Majors
MERGE (is:Major {name: 'Information Systems'})
SET is.faculty = 'Computing'

MERGE (meMajor:Major {name: 'Mechanical Engineering'})
SET meMajor.faculty = 'Engineering'

MERGE (ba:Major {name: 'Business Administration'})
SET ba.faculty = 'Business'

// --- Courses
MERGE (cs102:Course {code: 'CS102'})
SET cs102.subject = 'Data Structures'

MERGE (db210:Course {code: 'DB210'})
SET db210.subject = 'Database Systems'

MERGE (pm301:Course {code: 'PM301'})
SET pm301.subject = 'Project Management'

MERGE (ne201:Course {code: 'NE201'})
SET ne201.subject = 'Network Engineering'

// --- Hobbies
MERGE (gaming:Hobby {name: 'Gaming'})
SET gaming.category = 'Entertainment'

MERGE (football:Hobby {name: 'Football'})
SET football.category = 'Sports'

MERGE (basketball:Hobby {name: 'Basketball'})
SET basketball.category = 'Sports'

// --- Users
MERGE (alice:User {name: 'Alice'})
SET alice.university = 'Uni A', alice.year = 2

MERGE (bob:User {name: 'Bob'})
SET bob.university = 'Uni A', bob.year = 2

MERGE (carol:User {name: 'Carol'})
SET carol.university = 'Uni A', carol.year = 3

MERGE (dave:User {name: 'Dave'})
SET dave.university = 'Uni B', dave.year = 2

MERGE (erin:User {name: 'Erin'})
SET erin.university = 'Uni B', erin.year = 1

MERGE (frank:User {name: 'Frank'})
SET frank.university = 'Uni C', frank.year = 4

// --- STUDIES
MERGE (alice)-[:STUDIES]->(is)
MERGE (carol)-[:STUDIES]->(is)
MERGE (dave)-[:STUDIES]->(meMajor)
MERGE (erin)-[:STUDIES]->(meMajor)
MERGE (bob)-[:STUDIES]->(ba)
MERGE (frank)-[:STUDIES]->(ba)

// --- TAKES (for Mutual Class Finder)
MERGE (alice)-[:TAKES]->(db210)
MERGE (alice)-[:TAKES]->(cs102)
MERGE (alice)-[:TAKES]->(pm301)

MERGE (bob)-[:TAKES]->(db210)
MERGE (bob)-[:TAKES]->(pm301)

MERGE (carol)-[:TAKES]->(cs102)
MERGE (carol)-[:TAKES]->(ne201)

MERGE (dave)-[:TAKES]->(cs102)
MERGE (dave)-[:TAKES]->(db210)

MERGE (erin)-[:TAKES]->(pm301)
MERGE (frank)-[:TAKES]->(pm301)

// --- LIKES (for Hobby Cluster)
MERGE (alice)-[:LIKES]->(gaming)
MERGE (bob)-[:LIKES]->(gaming)
MERGE (erin)-[:LIKES]->(gaming)
MERGE (frank)-[:LIKES]->(gaming)

MERGE (carol)-[:LIKES]->(football)
MERGE (dave)-[:LIKES]->(football)
MERGE (erin)-[:LIKES]->(football)

MERGE (alice)-[:LIKES]->(basketball)
MERGE (dave)-[:LIKES]->(basketball)

// --- CONNECTED_WITH (undirected modeling; query uses -[:CONNECTED_WITH]-)
// Alice's friends
MERGE (alice)-[:CONNECTED_WITH]->(bob)
MERGE (alice)-[:CONNECTED_WITH]->(carol)
MERGE (alice)-[:CONNECTED_WITH]->(dave)

// Friends of friends (for FoF with >=2 mutual)
MERGE (bob)-[:CONNECTED_WITH]->(erin)
MERGE (bob)-[:CONNECTED_WITH]->(frank)
MERGE (carol)-[:CONNECTED_WITH]->(erin)
MERGE (carol)-[:CONNECTED_WITH]->(frank)
