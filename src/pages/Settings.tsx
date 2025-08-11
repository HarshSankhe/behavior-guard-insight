import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { settingsAPI, SecuritySettings } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Activity, 
  Zap, 
  Save,
  AlertTriangle,
  Eye,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await settingsAPI.getSettings();
        setSettings(settingsData);
      } catch (error) {
        toast({
          title: "Error Loading Settings",
          description: "Failed to load security settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSensitivityChange = (sensitivity: 'Low' | 'Medium' | 'High') => {
    if (settings) {
      setSettings({ ...settings, sensitivity });
    }
  };

  const handleToggle = (key: keyof SecuritySettings, value: boolean) => {
    if (settings && typeof settings[key] === 'boolean') {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await settingsAPI.updateSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Security settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: "Failed to update security settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <SettingsIcon className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load settings</p>
        </div>
      </div>
    );
  }

  const getSensitivityColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-destructive border-destructive bg-destructive/10';
      case 'Medium': return 'text-warning border-warning bg-warning/10';
      case 'Low': return 'text-success border-success bg-success/10';
      default: return 'text-muted-foreground border-muted bg-muted/10';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-cyber rounded-lg flex items-center justify-center cyber-glow">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Settings</h1>
            <p className="text-muted-foreground">Configure behavioral monitoring and security preferences</p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 cyber-glow"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </div>
          )}
        </Button>
      </div>

      {/* Security Sensitivity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <Shield className="h-5 w-5 text-primary" />
            <span>Security Sensitivity</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust how sensitive the behavioral detection algorithms are
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Low', 'Medium', 'High'] as const).map((level) => (
              <div
                key={level}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  settings.sensitivity === level 
                    ? getSensitivityColor(level) + " cyber-glow-accent"
                    : "border-border hover:border-accent/50"
                )}
                onClick={() => handleSensitivityChange(level)}
              >
                <div className="text-center space-y-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full mx-auto flex items-center justify-center",
                    level === 'High' && "bg-destructive/20",
                    level === 'Medium' && "bg-warning/20",
                    level === 'Low' && "bg-success/20"
                  )}>
                    <Lock className={cn(
                      "h-4 w-4",
                      level === 'High' && "text-destructive",
                      level === 'Medium' && "text-warning",
                      level === 'Low' && "text-success"
                    )} />
                  </div>
                  <h3 className="font-medium text-card-foreground">{level}</h3>
                  <p className="text-xs text-muted-foreground">
                    {level === 'High' && "Maximum security, may have false positives"}
                    {level === 'Medium' && "Balanced security and usability"}
                    {level === 'Low' && "Minimum security, fewer alerts"}
                  </p>
                  {settings.sensitivity === level && (
                    <Badge variant="outline" className={getSensitivityColor(level)}>
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Activity className="h-5 w-5 text-accent" />
              <span>Real-time Monitoring</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enable continuous behavioral analysis
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="realtime" className="text-card-foreground font-medium">
                  Live Monitoring
                </Label>
                <p className="text-sm text-muted-foreground">
                  Monitor user behavior in real-time
                </p>
              </div>
              <Switch
                id="realtime"
                checked={settings.realTimeMonitoring}
                onCheckedChange={(checked) => handleToggle('realTimeMonitoring', checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="anomaly" className="text-card-foreground font-medium">
                  Anomaly Detection
                </Label>
                <p className="text-sm text-muted-foreground">
                  Detect unusual behavioral patterns
                </p>
              </div>
              <Switch
                id="anomaly"
                checked={settings.anomalyDetection}
                onCheckedChange={(checked) => handleToggle('anomalyDetection', checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {settings.realTimeMonitoring && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Active Monitoring</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your behavioral patterns are being analyzed for security
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Bell className="h-5 w-5 text-warning" />
              <span>Alert Notifications</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure how you receive security alerts
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications" className="text-card-foreground font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive instant security alerts
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.alertNotifications}
                onCheckedChange={(checked) => handleToggle('alertNotifications', checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-card-foreground">Alert Types</h4>
              <div className="space-y-2">
                {[
                  { label: 'Critical Threats', icon: AlertTriangle, color: 'text-destructive' },
                  { label: 'Behavioral Anomalies', icon: Zap, color: 'text-warning' },
                  { label: 'Login Attempts', icon: Lock, color: 'text-accent' },
                ].map((alert, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <alert.icon className={`h-4 w-4 ${alert.color}`} />
                    <span className="text-sm text-card-foreground flex-1">{alert.label}</span>
                    <Switch
                      checked={settings.alertNotifications}
                      onCheckedChange={(checked) => handleToggle('alertNotifications', checked)}
                      disabled={!settings.alertNotifications}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <Zap className="h-5 w-5 text-primary" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-accent">1.2M</div>
              <p className="text-sm text-muted-foreground">Events Processed</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-success">99.97%</div>
              <p className="text-sm text-muted-foreground">Detection Accuracy</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last System Update</span>
              <span className="text-card-foreground">2025-08-11 02:30 UTC</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Algorithm Version</span>
              <span className="text-card-foreground font-mono">v2.4.1-beta</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Database Status</span>
              <Badge variant="outline" className="text-success border-success">
                Synchronized
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;