import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authAPI.checkAuth();
      setIsAuthenticated(authenticated);
      
      // Redirect to login if not authenticated and not already on login page
      if (!authenticated && location.pathname !== '/') {
        navigate('/');
      }
      // Redirect to dashboard if authenticated and on login page
      else if (authenticated && location.pathname === '/') {
        navigate('/dashboard');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page without layout
  if (!isAuthenticated || location.pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;