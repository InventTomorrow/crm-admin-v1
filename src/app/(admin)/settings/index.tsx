import { Navigate } from 'react-router';

// Bare /settings has no content of its own — land on the admin's own profile,
// same as every other settings section is reached: a real route under it.
const SettingsPage = () => <Navigate to="/settings/profile" replace />;

export default SettingsPage;
