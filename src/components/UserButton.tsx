import { 
  SignInButton, 
  useUser,
  UserButton as ClerkUserButton 
} from '@clerk/clerk-react';

export function UserButton() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="w-8 h-8 bg-surface-light-container dark:bg-surface-dark-container rounded-full animate-pulse"></div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-body-medium font-medium text-on-surface dark:text-white">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-body-small text-on-surface-variant dark:text-gray-400">
            {user.primaryEmailAddress?.emailAddress}
          </div>
        </div>
        <ClerkUserButton 
          appearance={{
            elements: {
              avatarBox: "w-10 h-10 rounded-full border-2 border-primary-40 dark:border-accent-dark-gold",
              userButtonPopoverCard: "bg-surface-light dark:bg-surface-dark border border-outline-variant dark:border-gray-600",
              userButtonPopoverActions: "bg-surface-light dark:bg-surface-dark",
              userButtonPopoverActionButton: "text-on-surface dark:text-white hover:bg-primary-40/10 dark:hover:bg-white/10",
              userButtonPopoverFooter: "bg-surface-light dark:bg-surface-dark border-t border-outline-variant dark:border-gray-600"
            }
          }}
        />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="btn-filled bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black hover:bg-primary-40/90 dark:hover:bg-accent-dark-gold/90 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-200">
        Sign In
      </button>
    </SignInButton>
  );
}