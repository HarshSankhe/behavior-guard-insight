import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionEvent } from '@/lib/api';
import { Activity, AlertTriangle, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionTimelineProps {
  events: SessionEvent[];
}

const SessionTimeline = ({ events }: SessionTimelineProps) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'danger': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <Zap className="h-4 w-4 text-warning" />;
      case 'info': return <Info className="h-4 w-4 text-accent" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'danger': return 'border-destructive bg-destructive/10';
      case 'warning': return 'border-warning bg-warning/10';
      case 'info': return 'border-accent bg-accent/10';
      default: return 'border-muted bg-muted/10';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-card-foreground">
          <Activity className="h-5 w-5 text-primary" />
          <span>Session Activity</span>
          <div className="ml-auto">
            <Badge variant="secondary" className="animate-pulse">
              Live
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="relative">
              {/* Timeline line */}
              {index < events.length - 1 && (
                <div className="absolute left-6 top-8 w-0.5 h-8 bg-border" />
              )}
              
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200",
                  getSeverityColor(event.severity),
                  event.severity === 'danger' && "animate-pulse-glow"
                )}>
                  {getSeverityIcon(event.severity)}
                </div>
                
                {/* Content */}
                <div className="flex-1 space-y-2 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-card-foreground">{event.event}</h4>
                    <span className="text-sm text-muted-foreground font-mono">
                      {event.time}
                    </span>
                  </div>
                  
                  {event.details && (
                    <p className="text-sm text-muted-foreground">{event.details}</p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        event.severity === 'danger' && "border-destructive text-destructive",
                        event.severity === 'warning' && "border-warning text-warning",
                        event.severity === 'info' && "border-accent text-accent"
                      )}
                    >
                      {event.severity.toUpperCase()}
                    </Badge>
                    
                    {/* Data flow animation for active events */}
                    {event.severity !== 'info' && (
                      <div className="relative overflow-hidden w-20 h-1 bg-muted rounded-full">
                        <div className={cn(
                          "absolute h-full w-4 rounded-full animate-data-flow",
                          event.severity === 'danger' && "bg-destructive",
                          event.severity === 'warning' && "bg-warning"
                        )} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground/70">Session events will appear here</p>
          </div>
        )}
        
        {/* Live indicator */}
        <div className="flex items-center justify-center mt-6 pt-4 border-t border-border">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            <span>Monitoring active session</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionTimeline;