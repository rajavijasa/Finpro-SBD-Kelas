import { GraphDemo } from "@/components/graph-demo";
import {
  friendOfFriendRecommendations,
  hobbyCluster,
  mutualClassFinder,
} from "@/lib/recommendations";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userName = process.env.DEMO_USER_NAME ?? "Alice";
  const hobbyName = process.env.DEMO_HOBBY_NAME ?? "Gaming";
  const limitRaw = Number(process.env.DEMO_LIMIT ?? 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 10;

  const [mutual, fof, hobby] = await Promise.allSettled([
    mutualClassFinder({ userName, limit }),
    friendOfFriendRecommendations({ userName, limit }),
    hobbyCluster({ userName, hobbyName, limit }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">CampusCircle</h1>
        <p className="text-sm text-slate-600">
          Demo rekomendasi berbasis Neo4j untuk mahasiswa.
        </p>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <div className="text-slate-500">Demo user</div>
              <div className="font-medium">{userName}</div>
            </div>
            <div>
              <div className="text-slate-500">Hobby cluster</div>
              <div className="font-medium">{hobbyName}</div>
            </div>
            <div>
              <div className="text-slate-500">Limit</div>
              <div className="font-medium">{Number.isFinite(limit) ? limit : 10}</div>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">Mutual Class Finder</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mahasiswa lain yang mengambil kelas yang sama.
          </p>

          <div className="mt-4">
            {mutual.status === "rejected" ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                Gagal memuat: {String(mutual.reason?.message ?? mutual.reason)}
              </div>
            ) : mutual.value.length === 0 ? (
              <div className="text-sm text-slate-500">Tidak ada data.</div>
            ) : (
              <ul className="space-y-3">
                {mutual.value.map((item) => (
                  <li
                    key={item.user.name}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.user.name}</div>
                        <div className="text-xs text-slate-500">
                          {item.user.university} • Year {item.user.year}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                        {item.sharedCount} shared
                      </div>
                    </div>
                    {item.sharedCourses.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.sharedCourses.slice(0, 6).map((c) => (
                          <span
                            key={c.code}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {c.code}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">FoF Recommendation</h2>
          <p className="mt-1 text-sm text-slate-600">
            Rekomendasi orang baru dengan minimal 2 teman bersama.
          </p>

          <div className="mt-4">
            {fof.status === "rejected" ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                Gagal memuat: {String(fof.reason?.message ?? fof.reason)}
              </div>
            ) : fof.value.length === 0 ? (
              <div className="text-sm text-slate-500">Tidak ada data.</div>
            ) : (
              <ul className="space-y-3">
                {fof.value.map((item) => (
                  <li
                    key={item.user.name}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.user.name}</div>
                        <div className="text-xs text-slate-500">
                          {item.user.university} • Year {item.user.year}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                        {item.mutualCount} mutual
                      </div>
                    </div>
                    {item.mutualFriends.length > 0 ? (
                      <div className="mt-2 text-xs text-slate-600">
                        Mutual: {item.mutualFriends.map((f) => f.name).join(", ")}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">Hobby Cluster</h2>
          <p className="mt-1 text-sm text-slate-600">
            Kelompok mahasiswa yang menyukai hobby tertentu lintas fakultas.
          </p>

          <div className="mt-4">
            {hobby.status === "rejected" ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                Gagal memuat: {String(hobby.reason?.message ?? hobby.reason)}
              </div>
            ) : hobby.value.length === 0 ? (
              <div className="text-sm text-slate-500">Tidak ada data.</div>
            ) : (
              <ul className="space-y-3">
                {hobby.value.map((item) => (
                  <li
                    key={`${item.user.name}-${item.hobby.name}`}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="font-medium">{item.user.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {item.user.university} • Year {item.user.year}
                      {item.major?.faculty ? ` • ${item.major.faculty}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                        {item.hobby.name}
                      </span>
                      {item.hobby.category ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                          {item.hobby.category}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">Graph Demo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Visualisasi neighborhood (mirip Neo4j Browser).
          </p>
          <div className="mt-4">
            <Suspense
              fallback={
                <div className="flex h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
                  Loading graph...
                </div>
              }
            >
              <GraphDemo userName={userName} />
            </Suspense>
          </div>
        </div>
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        Tips: set env `DEMO_USER_NAME` dan `DEMO_HOBBY_NAME` di `.env.local`.
      </footer>
    </main>
  );
}
