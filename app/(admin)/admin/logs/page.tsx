"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const PAGE_SIZE = 30;

interface LogFilters {
  action: string;
  start: string;
  end: string;
}

const emptyFilters: LogFilters = {
  action: "",
  start: "",
  end: "",
};

function parseDate(value: string) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.getTime();
}

export default function AdminLogsPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const [draftFilters, setDraftFilters] = useState<LogFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<LogFilters>(emptyFilters);

  const appliedArgs = useMemo(() => {
    return {
      action: appliedFilters.action.trim() || undefined,
      startTime: parseDate(appliedFilters.start),
      endTime: parseDate(appliedFilters.end),
    };
  }, [appliedFilters]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.listAuditLogs,
    currentUser?.role === "admin" ? appliedArgs : "skip",
    { initialNumItems: PAGE_SIZE },
  );

  const actionOptions = useMemo(() => {
    const values = new Set(results.map((log) => log.action));
    return Array.from(values).sort();
  }, [results]);

  const handleApply = () => {
    setAppliedFilters(draftFilters);
  };

  const handleClear = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (status !== "CanLoadMore") {
        return;
      }
      const target = event.currentTarget;
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 120) {
        loadMore(PAGE_SIZE);
      }
    },
    [loadMore, status],
  );

  if (currentUser === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading admin profile...
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Sign in to access the admin dashboard.
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Admin access required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Ask an administrator to grant your account admin permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Audit logs</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Live activity feed for admin actions.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="filter-action">Action</Label>
            <Input
              id="filter-action"
              placeholder="user.updated"
              list="audit-actions"
              value={draftFilters.action}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  action: event.target.value,
                }))
              }
            />
            <datalist id="audit-actions">
              {actionOptions.map((action) => (
                <option key={action} value={action} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-start">Start date</Label>
            <Input
              id="filter-start"
              type="datetime-local"
              value={draftFilters.start}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  start: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-end">End date</Label>
            <Input
              id="filter-end"
              type="datetime-local"
              value={draftFilters.end}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  end: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition"
          >
            Apply filters
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Clear
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 self-center">
            Showing {results.length} entries
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent activity</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {results.length} entries
          </span>
        </div>
        <div
          className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[560px] overflow-y-auto"
          onScroll={handleScroll}
        >
          {results.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
              No audit activity yet.
            </div>
          ) : (
            results.map((log) => (
              <div key={log._id} className="p-4 flex gap-3">
                <div className="mt-1">
                  <span className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {log.action}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log._creationTime).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {log.actorName ?? log.actorEmail ?? "System"}
                  </p>
                  {log.metadata ? (
                    <pre className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        {status === "CanLoadMore" && (
          <div className="p-4">
            <button
              onClick={() => loadMore(PAGE_SIZE)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Load more
            </button>
          </div>
        )}
        {status === "LoadingMore" && (
          <div className="p-4 text-xs text-slate-400 dark:text-slate-500">
            Loading more logs...
          </div>
        )}
      </div>
    </div>
  );
}
