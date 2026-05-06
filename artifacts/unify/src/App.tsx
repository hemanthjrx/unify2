import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAppAuth } from "@/lib/auth";
import "@/lib/api-init";

import NotFound from "@/pages/not-found";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import DiscoverPage from "@/pages/discover";
import CommunitiesPage from "@/pages/communities";
import CommunityDetailPage from "@/pages/community-detail";
import ProfilePage from "@/pages/profile";
import UserProfilePage from "@/pages/user-profile";
import NotificationsPage from "@/pages/notifications";
import SearchPage from "@/pages/search";
import MarketplacePage from "@/pages/marketplace";
import FreelancePage from "@/pages/freelance";
import AdminPage from "@/pages/admin";
import HackathonsPage from "@/pages/hackathons";
import FollowersPage from "@/pages/followers";
import CoinHistoryPage from "@/pages/coin-history";
import MessagesPage from "@/pages/messages";
import MentorshipPage from "@/pages/mentorship";
import AnnouncementsPage from "@/pages/announcements";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 2 },
  },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { logout } = useAppAuth();
  const { data: profile, isLoading, error } = useGetMyProfile();

  useEffect(() => {
    // Only auto-logout if we get a persistent 401 (not a transient server restart).
    // We rely on React Query's default 3 retries — if still 401 after retries, log out.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (error as any)?.status;
    if (status === 401 && !isLoading) {
      logout();
      navigate("/sign-in");
    }
  }, [error, isLoading, logout, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading your space…
      </div>
    );
  }

  if (profile && !profile.onboardingComplete && location !== "/onboarding") {
    navigate("/onboarding");
    return null;
  }

  if (location === "/onboarding") {
    return <>{children}</>;
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}

function ProtectedRoutes() {
  return (
    <ProtectedShell>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/communities" component={CommunitiesPage} />
        <Route path="/communities/:slug" component={CommunityDetailPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/users/:username" component={UserProfilePage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/marketplace" component={MarketplacePage} />
        <Route path="/freelance" component={FreelancePage} />
        <Route path="/hackathons" component={HackathonsPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/messages/:username" component={MessagesPage} />
        <Route path="/mentorship" component={MentorshipPage} />
        <Route path="/mentorship/:id" component={MentorshipPage} />
        <Route path="/announcements" component={AnnouncementsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/followers" component={FollowersPage} />
        <Route path="/coin-history" component={CoinHistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedShell>
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAppAuth();
  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }
  return <ProtectedRoutes />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route component={AuthGate} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={BASE}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
