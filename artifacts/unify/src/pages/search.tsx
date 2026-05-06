import { useState } from "react";
import { Link } from "wouter";
import { useSearch, useListStudents, useFollowUser, useUnfollowUser, useJoinCommunity, useLeaveCommunity } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Users, UserCheck, UserPlus, ArrowRight, Coins, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const BRANCHES = ["AD", "AI", "CE", "AM", "IC", "CS", "EE", "CI", "EC", "IS", "ME"];
const STUDY_YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedStudyYear, setSelectedStudyYear] = useState<number | "">("");

  const debouncedQuery = useDebounce(query, 300);
  const querySearchEnabled = debouncedQuery.trim().length > 0;

  const { data: searchData, isLoading: searchLoading } = useSearch(
    { q: debouncedQuery },
    {
      query: {
        enabled: querySearchEnabled,
        queryKey: ["search", debouncedQuery],
      },
    },
  );

  const { data: studentList, isLoading: studentsLoading } = useListStudents(
    {
      ...(selectedBranch && { branch: selectedBranch }),
      ...(selectedStudyYear && { studyYear: selectedStudyYear }),
    },
    {
      query: {
        queryKey: ["students", selectedBranch, selectedStudyYear],
      },
    },
  );

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  const searchUsers = searchData?.users ?? [];
  const searchCommunities = searchData?.communities ?? [];
  const students = studentList ?? [];
  const hasSearchResults = searchUsers.length > 0 || searchCommunities.length > 0;
  const hasStudentResults = students.length > 0;
  const showSearchResults = querySearchEnabled;
  const showStudentList = selectedBranch || selectedStudyYear;

  const renderUserCard = (u: any) => (
    <div
      key={u.id}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border"
      data-testid={`result-user-${u.username}`}
    >
      <Link href={`/users/${u.username}`}>
        <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity flex-shrink-0">
          <AvatarFallback
            style={{ backgroundColor: u.avatarColor }}
            className="text-white text-sm font-semibold"
          >
            {u.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/users/${u.username}`}
          className="font-semibold text-sm hover:text-primary transition-colors"
        >
          @{u.username}
        </Link>
        {u.bio && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {u.bio}
          </p>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <Coins className="w-3 h-3 text-yellow-400" />
          <span className="text-[11px] text-muted-foreground">{u.coins}</span>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant={u.isFollowing ? "secondary" : "default"}
          size="sm"
          onClick={async () => {
            if (u.isFollowing) {
              await unfollow.mutateAsync({ username: u.username });
            } else {
              await follow.mutateAsync({ username: u.username });
            }
          }}
          data-testid={`button-follow-${u.username}`}
        >
          {u.isFollowing ? (
            <>
              <UserCheck className="w-3 h-3 mr-1" /> Following
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3 mr-1" /> Follow
            </>
          )}
        </Button>
        <Link href={`/users/${u.username}`}>
          <Button variant="outline" size="sm">
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderCommunityCard = (c: any) => (
    <div
      key={c.id}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border"
      data-testid={`result-community-${c.slug}`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{ backgroundColor: c.accentColor }}
      >
        {c.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/communities/${c.slug}`}
          className="font-semibold text-sm hover:text-primary transition-colors"
        >
          {c.name}
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {c.description}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{c.memberCount} members</span>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant={c.isMember ? "secondary" : "default"}
          size="sm"
          onClick={async () => {
            if (c.isMember) {
              await leave.mutateAsync({ id: c.id });
            } else {
              await join.mutateAsync({ id: c.id });
            }
          }}
          data-testid={`button-join-${c.slug}`}
        >
          {c.isMember ? "Leave" : "Join"}
        </Button>
        <Link href={`/communities/${c.slug}`}>
          <Button variant="outline" size="sm">
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-primary" /> Search
        </h1>
        <p className="text-sm text-muted-foreground">
          Find students and communities on Unify.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, communities…"
            className="pl-9 h-11 text-base"
            autoFocus
            data-testid="input-search"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              <Filter className="w-3 h-3 inline mr-1" /> Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Year of Study
            </label>
            <select
              value={selectedStudyYear}
              onChange={(e) => setSelectedStudyYear(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="">All Years</option>
              {STUDY_YEARS.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showStudentList && (
        <div>
          {studentsLoading && (
            <div className="text-center text-muted-foreground py-10 text-sm">
              Loading students…
            </div>
          )}

          {!studentsLoading && !hasStudentResults && (
            <div className="text-center text-muted-foreground py-14 text-sm">
              No students found for the selected filters.
            </div>
          )}

          {hasStudentResults && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                Students · {students.length}
              </h2>
              <div className="space-y-2">
                {students.map((u) => renderUserCard(u))}
              </div>
            </section>
          )}
        </div>
      )}

      {showSearchResults && (
        <div>
          {searchLoading && (
            <div className="text-center text-muted-foreground py-10 text-sm">
              Searching…
            </div>
          )}

          {!searchLoading && !hasSearchResults && (
            <div className="text-center text-muted-foreground py-14 text-sm">
              No results for "{debouncedQuery}".
            </div>
          )}

          {hasSearchResults && (
            <div className="space-y-6">
              {searchUsers.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                    Students · {searchUsers.length}
                  </h2>
                  <div className="space-y-2">
                    {searchUsers.map((u) => renderUserCard(u))}
                  </div>
                </section>
              )}

              {searchCommunities.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                    Communities · {searchCommunities.length}
                  </h2>
                  <div className="space-y-2">
                    {searchCommunities.map((c) => renderCommunityCard(c))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {!showSearchResults && !showStudentList && (
        <div className="text-center text-muted-foreground py-14 text-sm">
          Type to search for students and communities, or select branch and year to see students.
        </div>
      )}
    </div>
  );
}
