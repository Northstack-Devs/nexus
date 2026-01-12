"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Pencil, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";

const PLAN_PAGE_SIZE = 10;
const SUBSCRIPTION_PAGE_SIZE = 12;

interface PlanRow {
  _id: Id<"subscriptionPlans">;
  name: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  features: string[];
  isActive?: boolean;
}

interface SubscriptionRow {
  _id: Id<"subscriptions">;
  userId: Id<"users">;
  planId?: Id<"subscriptionPlans">;
  status: string;
  currentPeriodEnd?: number;
  canceledAt?: number;
}

interface UserRow {
  _id: Id<"users">;
  name: string | null;
  email: string | null;
}

interface PlanFormState {
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  features: string;
  isActive: boolean;
}

interface SubscriptionFormState {
  userId: string;
  planId: string;
  status: string;
  currentPeriodEnd: string;
}

const emptyPlan: PlanFormState = {
  name: "",
  description: "",
  priceMonthly: "",
  priceYearly: "",
  features: "",
  isActive: true,
};

const emptySubscription: SubscriptionFormState = {
  userId: "",
  planId: "none",
  status: "active",
  currentPeriodEnd: "",
};

export default function AdminSubscriptionsPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const users = useQuery(
    api.admin.listUsers,
    currentUser?.role === "admin" ? {} : "skip",
  ) as UserRow[] | undefined;

  const [planSearch, setPlanSearch] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState("all");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [subscriptionUser, setSubscriptionUser] = useState("all");
  const [subscriptionPlan, setSubscriptionPlan] = useState("all");

  const planArgs = useMemo(
    () => ({
      search: planSearch.trim() || undefined,
      isActive:
        planStatusFilter === "all" ? undefined : planStatusFilter === "active",
    }),
    [planSearch, planStatusFilter],
  );

  const subscriptionArgs = useMemo(
    () => ({
      status: subscriptionStatus === "all" ? undefined : subscriptionStatus,
      userId:
        subscriptionUser === "all"
          ? undefined
          : (subscriptionUser as Id<"users">),
      planId:
        subscriptionPlan === "all"
          ? undefined
          : (subscriptionPlan as Id<"subscriptionPlans">),
    }),
    [subscriptionPlan, subscriptionStatus, subscriptionUser],
  );

  const {
    results: planResults,
    status: planStatus,
    loadMore: loadMorePlans,
  } = usePaginatedQuery(
    api.admin.listSubscriptionPlans,
    currentUser?.role === "admin" ? planArgs : "skip",
    { initialNumItems: PLAN_PAGE_SIZE },
  );

  const {
    results: subscriptionResults,
    status: subscriptionStatusState,
    loadMore: loadMoreSubscriptions,
  } = usePaginatedQuery(
    api.admin.listSubscriptions,
    currentUser?.role === "admin" ? subscriptionArgs : "skip",
    { initialNumItems: SUBSCRIPTION_PAGE_SIZE },
  );

  const createPlan = useMutation(api.admin.createSubscriptionPlan);
  const updatePlan = useMutation(api.admin.updateSubscriptionPlan);
  const deletePlan = useMutation(api.admin.deleteSubscriptionPlan);
  const createSubscription = useMutation(api.admin.createSubscription);
  const updateSubscription = useMutation(api.admin.updateSubscription);

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlan);
  const [planSaving, setPlanSaving] = useState(false);

  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] =
    useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<SubscriptionRow | null>(null);
  const [subscriptionForm, setSubscriptionForm] =
    useState<SubscriptionFormState>(emptySubscription);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);

  const activePlans = useMemo(
    () => planResults.filter((plan) => plan.isActive !== false).length,
    [planResults],
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

  if (users === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading subscriptions...
      </div>
    );
  }

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm(emptyPlan);
    setIsPlanDialogOpen(true);
  };

  const handleOpenEditPlan = (plan: PlanRow) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description ?? "",
      priceMonthly: plan.priceMonthly?.toString() ?? "",
      priceYearly: plan.priceYearly?.toString() ?? "",
      features: plan.features.join(", "),
      isActive: plan.isActive !== false,
    });
    setIsPlanDialogOpen(true);
  };

  const closePlanDialog = () => {
    setIsPlanDialogOpen(false);
    setEditingPlan(null);
    setPlanForm(emptyPlan);
  };

  const handleSavePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlanSaving(true);

    const payload = {
      name: planForm.name.trim(),
      description: planForm.description.trim() || undefined,
      priceMonthly: planForm.priceMonthly
        ? Number(planForm.priceMonthly)
        : undefined,
      priceYearly: planForm.priceYearly
        ? Number(planForm.priceYearly)
        : undefined,
      features: planForm.features
        ? planForm.features.split(",").map((feature) => feature.trim())
        : [],
      isActive: planForm.isActive,
    };

    if (editingPlan) {
      await updatePlan({ planId: editingPlan._id, ...payload });
    } else {
      await createPlan(payload);
    }

    setPlanSaving(false);
    closePlanDialog();
  };

  const handleDeletePlan = async (plan: PlanRow) => {
    const confirmed = window.confirm(
      `Delete the ${plan.name} plan? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    await deletePlan({ planId: plan._id });
  };

  const handleOpenCreateSubscription = () => {
    setEditingSubscription(null);
    setSubscriptionForm(emptySubscription);
    setIsSubscriptionDialogOpen(true);
  };

  const handleOpenEditSubscription = (subscription: SubscriptionRow) => {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      userId: subscription.userId,
      planId: subscription.planId ?? "none",
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toISOString().slice(0, 16)
        : "",
    });
    setIsSubscriptionDialogOpen(true);
  };

  const closeSubscriptionDialog = () => {
    setIsSubscriptionDialogOpen(false);
    setEditingSubscription(null);
    setSubscriptionForm(emptySubscription);
  };

  const handleSaveSubscription = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubscriptionSaving(true);

    const payload = {
      userId: subscriptionForm.userId as Id<"users">,
      planId:
        subscriptionForm.planId && subscriptionForm.planId !== "none"
          ? (subscriptionForm.planId as Id<"subscriptionPlans">)
          : undefined,
      status: subscriptionForm.status,
      currentPeriodEnd: subscriptionForm.currentPeriodEnd
        ? new Date(subscriptionForm.currentPeriodEnd).getTime()
        : undefined,
    };

    if (editingSubscription) {
      await updateSubscription({
        subscriptionId: editingSubscription._id,
        planId: payload.planId,
        status: payload.status,
        currentPeriodEnd: payload.currentPeriodEnd,
      });
    } else {
      await createSubscription(payload);
    }

    setSubscriptionSaving(false);
    closeSubscriptionDialog();
  };

  const getUserLabel = (userId: Id<"users">) => {
    const user = users.find((item) => item._id === userId);
    return user?.name ?? user?.email ?? userId;
  };

  const getPlanLabel = (planId?: Id<"subscriptionPlans">) => {
    if (!planId) {
      return "No plan";
    }
    const plan = planResults.find((item) => item._id === planId);
    return plan?.name ?? "Unknown plan";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Subscriptions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage subscription plans and assign plans to users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Plans loaded
            </p>
            <span className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">{planResults.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activePlans} active in view
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Subscriptions loaded
            </p>
            <span className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {subscriptionResults.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filtered assignments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Subscription plans</h3>
            <button
              onClick={handleOpenCreatePlan}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition"
            >
              <Plus className="h-3 w-3" />
              New plan
            </button>
          </div>
          <div className="border-b border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-search">Search</Label>
                <Input
                  id="plan-search"
                  placeholder="Name or description"
                  value={planSearch}
                  onChange={(event) => setPlanSearch(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-status-filter">Status</Label>
                <Select
                  value={planStatusFilter}
                  onValueChange={setPlanStatusFilter}
                >
                  <SelectTrigger id="plan-status-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Features</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {planResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No plans match this filter.
                    </td>
                  </tr>
                ) : (
                  planResults.map((plan) => (
                    <tr
                      key={plan._id}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {plan.description || "No description"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {plan.priceMonthly !== undefined && (
                          <span>${plan.priceMonthly}/mo</span>
                        )}
                        {plan.priceMonthly !== undefined &&
                        plan.priceYearly !== undefined ? (
                          <span className="mx-1">·</span>
                        ) : null}
                        {plan.priceYearly !== undefined && (
                          <span>${plan.priceYearly}/yr</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {plan.features.length === 0 ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              No features
                            </span>
                          ) : (
                            plan.features.map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
                              >
                                {feature}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {plan.isActive === false ? "Inactive" : "Active"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => void handleDeletePlan(plan)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>{planResults.length} loaded</span>
            {planStatus === "CanLoadMore" && (
              <button
                onClick={() => loadMorePlans(PLAN_PAGE_SIZE)}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Load more
              </button>
            )}
            {planStatus === "LoadingMore" && <span>Loading...</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold">User subscriptions</h3>
            <button
              onClick={handleOpenCreateSubscription}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition"
            >
              <Plus className="h-3 w-3" />
              Assign plan
            </button>
          </div>
          <div className="border-b border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="subscription-user-filter">User</Label>
                <Select
                  value={subscriptionUser}
                  onValueChange={setSubscriptionUser}
                >
                  <SelectTrigger id="subscription-user-filter">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name ?? user.email ?? user._id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-plan-filter">Plan</Label>
                <Select
                  value={subscriptionPlan}
                  onValueChange={setSubscriptionPlan}
                >
                  <SelectTrigger id="subscription-plan-filter">
                    <SelectValue placeholder="All plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plans</SelectItem>
                    {planResults.map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-status-filter">Status</Label>
                <Select
                  value={subscriptionStatus}
                  onValueChange={setSubscriptionStatus}
                >
                  <SelectTrigger id="subscription-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="past_due">Past due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Period end</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No subscriptions match this filter.
                    </td>
                  </tr>
                ) : (
                  subscriptionResults.map((subscription) => (
                    <tr
                      key={subscription._id}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {getUserLabel(subscription.userId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {getPlanLabel(subscription.planId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {subscription.status}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {subscription.currentPeriodEnd
                          ? new Date(
                              subscription.currentPeriodEnd,
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleOpenEditSubscription(subscription)
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>{subscriptionResults.length} loaded</span>
            {subscriptionStatusState === "CanLoadMore" && (
              <button
                onClick={() => loadMoreSubscriptions(SUBSCRIPTION_PAGE_SIZE)}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Load more
              </button>
            )}
            {subscriptionStatusState === "LoadingMore" && (
              <span>Loading...</span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan
                ? "Edit subscription plan"
                : "Create subscription plan"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input
                id="plan-name"
                value={planForm.name}
                onChange={(event) =>
                  setPlanForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">Description</Label>
              <Input
                id="plan-description"
                value={planForm.description}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-monthly">Monthly price</Label>
                <Input
                  id="plan-monthly"
                  type="number"
                  value={planForm.priceMonthly}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      priceMonthly: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-yearly">Yearly price</Label>
                <Input
                  id="plan-yearly"
                  type="number"
                  value={planForm.priceYearly}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      priceYearly: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-features">Features (comma separated)</Label>
              <Input
                id="plan-features"
                value={planForm.features}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    features: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-status">Status</Label>
              <Select
                value={planForm.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    isActive: value === "active",
                  }))
                }
              >
                <SelectTrigger id="plan-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={closePlanDialog}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={planSaving || planForm.name.trim().length === 0}
                className="rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition disabled:opacity-50"
              >
                {planSaving ? "Saving..." : "Save plan"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSubscriptionDialogOpen}
        onOpenChange={setIsSubscriptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubscription
                ? "Edit subscription"
                : "Assign subscription"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubscription} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscription-user">User</Label>
              <Select
                value={subscriptionForm.userId}
                onValueChange={(value) =>
                  setSubscriptionForm((prev) => ({ ...prev, userId: value }))
                }
              >
                <SelectTrigger id="subscription-user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name ?? user.email ?? user._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-plan">Plan</Label>
              <Select
                value={subscriptionForm.planId}
                onValueChange={(value) =>
                  setSubscriptionForm((prev) => ({ ...prev, planId: value }))
                }
              >
                <SelectTrigger id="subscription-plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {planResults.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">No plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-status">Status</Label>
              <Select
                value={subscriptionForm.status}
                onValueChange={(value) =>
                  setSubscriptionForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="subscription-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-period">Period end</Label>
              <Input
                id="subscription-period"
                type="datetime-local"
                value={subscriptionForm.currentPeriodEnd}
                onChange={(event) =>
                  setSubscriptionForm((prev) => ({
                    ...prev,
                    currentPeriodEnd: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={closeSubscriptionDialog}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  subscriptionSaving ||
                  !subscriptionForm.userId ||
                  subscriptionForm.status.trim().length === 0
                }
                className="rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition disabled:opacity-50"
              >
                {subscriptionSaving ? "Saving..." : "Save subscription"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
