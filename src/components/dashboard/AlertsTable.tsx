import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/lib/api';
import { CheckCircle, AlertTriangle, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsTableProps {
  alerts: Alert[];
  onMarkResolved: (alertId: number) => void;
}

const AlertsTable = ({ alerts, onMarkResolved }: AlertsTableProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'border-destructive text-destructive bg-destructive/10';
      case 'high': return 'border-warning text-warning bg-warning/10';
      case 'medium': return 'border-accent text-accent bg-accent/10';
      case 'low': return 'border-success text-success bg-success/10';
      default: return 'border-muted text-muted-foreground bg-muted/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'investigating': return <Eye className="h-4 w-4 text-accent" />;
      case 'unresolved': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <span>Security Alerts</span>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="animate-pulse-glow">
              {alerts.filter(a => a.status === 'Unresolved').length} Active
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200 hover:bg-muted/50",
                alert.status === 'Unresolved' && alert.severity === 'Critical' && "animate-alert-pulse"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(alert.status)}
                    <h4 className="font-medium text-card-foreground">{alert.type}</h4>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getSeverityColor(alert.severity))}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  
                  {alert.description && (
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(alert.time)}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={alert.status === 'Resolved' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          alert.status === 'Resolved' && "bg-success/20 text-success border-success/30",
                          alert.status === 'Investigating' && "bg-accent/20 text-accent border-accent/30",
                          alert.status === 'Unresolved' && "bg-destructive/20 text-destructive border-destructive/30"
                        )}
                      >
                        {alert.status}
                      </Badge>
                      
                      {alert.status === 'Unresolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkResolved(alert.id)}
                          className="text-xs hover:bg-success hover:text-success-foreground border-success/30 text-success"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {alerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-sm text-muted-foreground/70">Your system is secure</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsTable;