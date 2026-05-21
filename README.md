# 🌌 CampusCircle: High-Performance Social Match & Graph Analytics Platform

```bash
Group 11 Siang Members:
- Raja Avicenna Al-Kindi Vijasa (2406416352)
- Toriq Fathoni Dezi (2406487115)
- Danish Al Fayyadh Sunarta (2406416951)
- Alwahib Raffi Raihan (2406397630)
- Perry Tjahya (2406409965)
```


CampusCircle is an advanced, full-stack academic social matching application designed to help university students **discover, swipe, and connect** with academic peers, classmates, and interest-mates. The project is built using a modern **Next.js** frontend framework and a **NestJS** backend, backed by a **dual-database architecture**: **Supabase PostgreSQL** (for structured relational querying) and **Neo4j Aura** (for high-performance social graph traversals).

---

## 📂 Project Structure

```
Finpro-SBD-Kelas/
├── frontend/                     # Next.js application (UI, auth, server actions)
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages & actions
│   │   │   ├── (dashboard)/      # Dashboard routes (discover, messages)
│   │   │   ├── actions/          # Server actions (auth, messages)
│   │   │   ├── api/              # API routes (recommendations)
│   │   │   ├── likes/            # Swipe/likes page
│   │   │   ├── login/            # Login page
│   │   │   ├── radar/            # Social Radar visualization
│   │   │   └── register/         # Registration page
│   │   ├── components/           # Reusable React components
│   │   ├── db/                   # Drizzle ORM database configuration
│   │   └── lib/                  # Shared libraries (Neo4j driver, recommendations)
│   └── scripts/                  # Database sync & seed scripts
│       ├── postgres-full-sync.mjs
│       ├── sync-databases.mjs
│       ├── neo4j-seed.mjs
│       ├── seed-swipes.mjs
│       └── drizzle-push.mjs
├── backend/                      # NestJS backend API
│   └── src/
│       ├── neo4j/                # Neo4j module & service
│       └── health/               # Health check endpoints
├── neo4j/                        # Neo4j seed & index scripts
│   ├── seed.cypher               # Full graph database seed
│   └── indexes.cypher            # Graph index definitions
├── benchmark_analysis.ipynb      # Performance benchmark Jupyter notebook
└── benchmark_samples - Copy.csv  # Raw benchmark timing data (30 runs)
```

---

## 🏛️ System Architecture & Dual-Database Parity

To enable direct, side-by-side performance benchmarking of relational queries versus graph queries, CampusCircle implements a **complete dual-database paradigm**. Every single profile attribute, academic enrollment, and social interest is synchronized and stored in normalized schemas in both databases.

```mermaid
graph TD
    Client[Next.js App UI] -->|Auth & Swipes| API[Server Actions / Auth Actions]
    API -->|1. Direct Write| PG[(Supabase PostgreSQL)]
    API -->|2. Parallel Write| Neo[(Neo4j Aura Graph DB)]
    
    Sync[Sync Engine: postgres-full-sync.mjs] -.->|Periodic/On-Demand Parity| Neo
    Sync -.->|Cascades & Truncates| PG
```

### 🗄️ Relational Database Schema (PostgreSQL)

The PostgreSQL database is normalized to **Third Normal Form (3NF)** to avoid duplicates and ensure efficient indexing:

| Table | Key Columns | Description |
|-------|------------|-------------|
| `users` | `id`, `full_name`, `username`, `password`, `phone_number`, `university`, `year`, `bio`, `major_id` | Core student profiles |
| `majors` | `id`, `name`, `faculty` | Academic major catalog |
| `courses` | `id`, `code`, `name`, `faculty` | University course catalog |
| `hobbies` | `id`, `name`, `category` | Student interest catalog |
| `user_courses` | `user_id`, `course_id` | Many-to-many: students ↔ courses |
| `user_hobbies` | `user_id`, `hobby_id` | Many-to-many: students ↔ hobbies |

### 🕸️ Graph Database Schema (Neo4j)

```mermaid
classDiagram
    class Student {
        name: String
        university: String
        year: Integer
        bio: String
    }
    class Major {
        name: String
        faculty: String
    }
    class Course {
        code: String
        name: String
        faculty: String
    }
    class Hobby {
        name: String
        category: String
    }

    Student --> Major : STUDIES
    Student --> Course : TAKES
    Student --> Hobby : LIKES
    Student --> Student : MATCHES
    Student --> Student : BLOCKS
```

**Node Types:** `:Student`, `:Major`, `:Course`, `:Hobby`
**Relationship Types:** `STUDIES`, `TAKES`, `LIKES`, `MATCHES`, `BLOCKS`

---

## ⚡ Real-Time Write Cascades & Sync Engine

### A. Real-Time Server Action Writing

When a student signs up or updates their profile via `src/app/actions/auth.ts`:
1. **PostgreSQL Mutation** — Updates credentials, bio, year; performs clean batch-insert of courses and hobbies.
2. **Neo4j Parallel Mutation** — Cypher update using resilient `MERGE` blocks to re-establish graph relationships.

### B. Master Sync Engine (`postgres-full-sync.mjs`)

The master parity sync script reads all active relationships from Neo4j, flushes PostgreSQL's junction tables, and repopulates them using deduplicated transaction batches:
- **Unique Formatted Credentials** — Standardizes names into unique usernames and passwords.
- **Fast Batch Inserts** — Parallel SQL batch execution ensuring **100% parity** between Neo4j and PostgreSQL.

---

## 📊 Performance Benchmark: SQL vs. Graph Database

The benchmark compares **PostgreSQL (Relational Multi-Joins)** against **Neo4j (Graph Path Traversal)** across recursive classmate depth queries. Data was collected over **30 independent runs** and analyzed in `benchmark_analysis.ipynb`.

### Benchmark Methodology

The benchmark queries find classmates connected through shared courses and hobbies at increasing traversal depths:

**Depth 1** — Direct classmates (1-hop shared course)
**Depth 2** — Friends-of-friends (2-hop course chain)
**Depth 3** — Deep social traversal (3-hop course chain)


#### PostgreSQL Query Example (Depth 1):
```sql
SELECT DISTINCT u2.id, u2.full_name 
FROM users u1
JOIN user_courses uc1 ON u1.id = uc1.user_id
JOIN user_courses uc2 ON uc1.course_id = uc2.course_id AND uc1.user_id != uc2.user_id
JOIN users u2 ON uc2.user_id = u2.id
JOIN user_hobbies uh1 ON u1.id = uh1.user_id
JOIN user_hobbies uh2 ON uh1.hobby_id = uh2.hobby_id AND uh2.user_id = u2.id
WHERE u1.username = 'mrbeast';
```

#### Neo4j Cypher Query Example (Depth 1):
```cypher
MATCH (s1:Student {name: "MrBeast"})-[:TAKES]->(c:Course)<-[:TAKES]-(s2:Student),
      (s1)-[:LIKES]->(h:Hobby)<-[:LIKES]-(s2)
RETURN DISTINCT s2.name;
```

### 📈 Benchmark Results Summary (30 Runs)

| Metric | Depth 1 SQL (ms) | Depth 1 Neo4j (ms) | Depth 2 SQL (ms) | Depth 2 Neo4j (ms) | Depth 3 SQL (ms) | Depth 3 Neo4j (ms) |
|--------|:-----------------:|:--------------------:|:-----------------:|:--------------------:|:-----------------:|:--------------------:|
| **Mean** | 64.97 | 39.13 | 96.87 | 164.43 | **16,101.10** | **645.60** |
| **Std Dev** | 8.08 | 5.54 | 12.36 | 25.58 | 2,966.57 | 52.32 |
| **Min** | 56.00 | 31.00 | 84.00 | 142.00 | 9,417.00 | 535.00 |
| **25%** | 59.00 | 36.00 | 89.00 | 152.00 | 15,020.75 | 619.25 |
| **Median** | 63.50 | 38.00 | 92.00 | 158.00 | 16,855.50 | 640.50 |
| **75%** | 67.75 | 41.75 | 101.75 | 166.50 | 17,419.25 | 664.50 |
| **Max** | 88.00 | 56.00 | 133.00 | 253.00 | 20,159.00 | 801.00 |

### Raw Benchmark Data (First 10 Runs)

| Run | Depth1 SQL (ms) | Depth1 Neo4j (ms) | Depth2 SQL (ms) | Depth2 Neo4j (ms) | Depth3 SQL (ms) | Depth3 Neo4j (ms) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 77 | 42 | 101 | 253 | 9,961 | 647 |
| 2 | 88 | 36 | 108 | 221 | 9,502 | 697 |
| 3 | 60 | 41 | 98 | 232 | 10,767 | 801 |
| 4 | 68 | 39 | 132 | 170 | 9,417 | 752 |
| 5 | 66 | 33 | 106 | 160 | 16,696 | 535 |
| 6 | 58 | 37 | 109 | 168 | 18,787 | 668 |
| 7 | 64 | 41 | 87 | 158 | 20,011 | 683 |
| 8 | 60 | 39 | 96 | 154 | 17,336 | 693 |
| 9 | 59 | 36 | 133 | 152 | 20,140 | 653 |
| 10 | 59 | 56 | 110 | 170 | 16,939 | 605 |


### 🔑 Key Insights & Conclusion

- **🔴 Exponential Relational Degradation:** At Depth 3, PostgreSQL query execution times shoot up to **~16.5 seconds** (mean). This is caused by joining the junction table `user_courses` and entity table `users` multiple times, creating a massive intermediate Cartesian state space and index-search overhead.

- **🟢 Graph DB Flat Scale:** In contrast, Neo4j takes only **~646ms** (mean) at Depth 3. By utilizing **Index-Free Adjacency** combined with `WITH DISTINCT` hop pruning, Neo4j navigates direct memory pointers and discards redundant pathways, achieving a **~25x speedup** at Depth 3!

- **⚖️ The Sweet Spot:** PostgreSQL is competitive at Depth 1 (~65ms vs Neo4j ~39ms) and Depth 2 (~97ms vs Neo4j ~164ms) due to simple indices, but shows dramatic structural limits at deep social paths — proving why a **Graph Database is essential** for complex campus matching use cases.

![image](https://hackmd.io/_uploads/HkP78X3JGl.png)

![image](https://hackmd.io/_uploads/rJmhUX31Me.png)


---

## 🔮 Social Radar Visualizer

The **CampusCircle Social Radar** is an interactive canvas built using React force-directed physics. It renders the social orbits and academic nodes of your entire university in real-time.

### 🛰️ Interactive Filter Controls
1. **🌌 My Personal Orbit** — Instantly isolates your profile node, major, enrolled courses, and hobbies with smooth physics transitions.
2. **✨ Show Shared Sparks** — Dynamically expands your orbit to display classmate peers and students who share your hobbies.

### 🎨 Node Color System
| Node Type | Color | Hex |
|-----------|-------|-----|
| Active User | Pink (Glowing) | `#f43f5e` |
| Majors | Violet | `#7c3aed` |
| Courses | Emerald | `#059669` |
| Hobbies | Amber | `#d97706` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **yarn**
- **Supabase PostgreSQL** account
- **Neo4j Aura** account

### Environment Setup

Create a `.env` file in the `frontend/` directory:

```env
# Relational DB
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Graph DB
NEO4J_URI="neo4j+s://[NEO4J_ID].databases.neo4j.io"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="[NEO4J_PASSWORD]"
```

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Database Synchronization

To sync Neo4j graph relationships into PostgreSQL with clean standardized credentials:

```bash
cd frontend
node scripts/postgres-full-sync.mjs
```

### Running the Application

```bash
# Start the frontend (Next.js)
cd frontend
npm run dev

# Start the backend (NestJS) — in a separate terminal
cd backend
npm run start:dev
```

Open [http://localhost:3000](http://localhost:3000) to log in, edit your orbits, swipe on candidates, and explore your social circles on the interactive Social Radar page!

### Running Benchmarks

Open `benchmark_analysis.ipynb` in Jupyter Notebook or JupyterLab:

```bash
# Requires Python 3.x with pandas, numpy, matplotlib, seaborn
jupyter notebook benchmark_analysis.ipynb
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS |
| **Backend** | NestJS, TypeScript |
| **Relational DB** | Supabase PostgreSQL (Drizzle ORM) |
| **Graph DB** | Neo4j Aura (Cypher) |
| **Visualization** | React Force-Directed Graph (Canvas) |
| **Benchmarking** | Python, Pandas, Matplotlib, Seaborn |

---

*Document compiled and verified for the CampusCircle Development Team.*
