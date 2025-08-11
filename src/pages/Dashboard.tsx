import { useEffect, useState } from 'react';
import { dashboardAPI, RiskData, Alert, SessionEvent } from '@/lib/api';
import RiskGauge from '@/components/dashboard/RiskGauge';
import AlertsTable from '@/components/dashboard/AlertsTable';
import SessionTimeline from '@/components/dashboard/SessionTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Shield, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [riskResponse, alertsResponse, eventsResponse] = await Promise.all([
          dashboardAPI.getRiskScore(),
          dashboardAPI.getAlerts(),
          dashboardAPI.getSessionEvents()
        ]);
        
        setRiskData(riskResponse);
        setAlerts(alertsResponse);
        setSessionEvents(eventsResponse);
      } catch (error) {
        toast({
          title: "Error Loading Dashboard",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Real-time risk score updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newRiskData = await dashboardAPI.getRiskScore();
        setRiskData(newRiskData);
      } catch (error) {
        console.error('Failed to update risk score:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle alert resolution
  const handleMarkResolved = async (alertId: number) => {
    try {
      await dashboardAPI.markAlertResolved(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'Resolved' as const }
          : alert
      ));
      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading security dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(alert => alert.status === 'Unresolved').length;
  const criticalAlerts = alerts.filter(alert => alert.severity === 'Critical').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time behavioral monitoring and threat detection</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            Live Monitoring
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {riskData?.riskScore || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary cyber-glow" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-destructive">
                  {activeAlerts}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Today</p>
                <p className="text-2xl font-bold text-card-foreground">
                  127
                </p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Threats Blocked</p>
                <p className="text-2xl font-bold text-success">
                  34
                </p>
              </div>
              <Eye className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge */}
        <div className="lg:col-span-1">
          {riskData && (
            <RiskGauge 
              riskScore={riskData.riskScore} 
              trend={riskData.trend}
            />
          )}
        </div>

        {/* Session Timeline */}
        <div className="lg:col-span-1">
          <SessionTimeline events={sessionEvents} />
        </div>

        {/* Additional Stats */}
        <div className="lg:col-span-1 space-y-4">
          {/* System Status */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Detection</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Real-time Monitoring</span>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  <Activity className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Threat Database</span>
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Updated
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full p-2 text-left text-sm rounded-lg hover:bg-muted transition-colors text-card-foreground">
                Generate Security Report
              </button>
              <button className="w-full p-2 text-left text-sm rounded-lg hover:bg-muted transition-colors text-card-foreground">
                Export Activity Logs
              </button>
              <button className="w-full p-2 text-left text-sm rounded-lg hover:bg-muted transition-colors text-card-foreground">
                Update Security Rules
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="col-span-full">
        <AlertsTable alerts={alerts} onMarkResolved={handleMarkResolved} />
      </div>
    </div>
  );
};

export default Dashboard;