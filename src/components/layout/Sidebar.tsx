import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield, 
  BarChart3, 
  User, 
  Settings, 
  AlertTriangle,
  Activity,
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border flex flex-col h-full transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary cyber-glow" />
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">CyberGuard</h1>
                <p className="text-xs text-sidebar-foreground/60">Security Dashboard</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground cyber-glow shadow-lg" 
                  : "text-sidebar-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.name}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={onLogout}
          variant="ghost"
          className={cn(
            "w-full flex items-center text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors",
            isCollapsed ? "justify-center px-2" : "justify-start px-3"
          )}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;