// src/auth/UseAuth.jsx
import { useAuthContext } from './AuthProvider.jsx';

// BUT : éviter d’importer useAuthContext partout
export default function useAuth() {
  return useAuthContext();
}
