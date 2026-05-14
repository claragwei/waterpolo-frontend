import { Button } from './ui/button';
import { useAuth } from '../auth/AuthContext';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-6">Team and app preferences will live here.</p>
      {user && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700 mb-3">Signed in as {user.email}</p>
          <Button type="button" variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
