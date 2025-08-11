import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskGaugeProps {
  riskScore: number;
  trend: 'up' | 'down' | 'stable';
}

const RiskGauge = ({ riskScore, trend }: RiskGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the risk score
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(riskScore);
    }, 100);
    return () => clearTimeout(timer);
  }, [riskScore]);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', color: 'hsl(var(--destructive))', bgColor: 'hsl(var(--destructive) / 0.1)' };
    if (score >= 60) return { level: 'High', color: 'hsl(var(--warning))', bgColor: 'hsl(var(--warning) / 0.1)' };
    if (score >= 40) return { level: 'Medium', color: 'hsl(var(--accent))', bgColor: 'hsl(var(--accent) / 0.1)' };
    return { level: 'Low', color: 'hsl(var(--success))', bgColor: 'hsl(var(--success) / 0.1)' };
  };

  const riskInfo = getRiskLevel(animatedScore);

  // Data for the gauge chart
  const data = [
    { name: 'Risk', value: animatedScore, fill: riskInfo.color },
    { name: 'Safe', value: 100 - animatedScore, fill: 'hsl(var(--muted))' }
  ];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <span>Risk Score</span>
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            trend === 'up' && "text-destructive bg-destructive/10",
            trend === 'down' && "text-success bg-success/10",
            trend === 'stable' && "text-muted-foreground bg-muted/10"
          )}>
            <TrendIcon className="h-3 w-3" />
            <span className="capitalize">{trend}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          {/* Gauge Chart */}
          <div className="relative h-48 w-48 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      className={index === 0 ? "drop-shadow-lg" : ""}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn(
                "text-4xl font-bold transition-all duration-1000 ease-out",
                riskScore >= 80 && "text-destructive animate-pulse-glow",
                riskScore >= 60 && riskScore < 80 && "text-warning",
                riskScore >= 40 && riskScore < 60 && "text-accent",
                riskScore < 40 && "text-success"
              )}>
                {Math.round(animatedScore)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {riskInfo.level}
              </div>
            </div>
          </div>

          {/* Risk Level Indicator */}
          <div className="mt-6 space-y-2">
            <div 
              className={cn(
                "p-3 rounded-lg border transition-all duration-300",
                riskScore >= 80 && "border-destructive/30 bg-destructive/5 animate-alert-pulse",
                riskScore >= 60 && riskScore < 80 && "border-warning/30 bg-warning/5",
                riskScore >= 40 && riskScore < 60 && "border-accent/30 bg-accent/5",
                riskScore < 40 && "border-success/30 bg-success/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">Threat Level</span>
                <span className={cn(
                  "text-sm font-bold",
                  riskScore >= 80 && "text-destructive",
                  riskScore >= 60 && riskScore < 80 && "text-warning",
                  riskScore >= 40 && riskScore < 60 && "text-accent",
                  riskScore < 40 && "text-success"
                )}>
                  {riskInfo.level}
                </span>
              </div>
              
              {/* Risk Bar */}
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-1000 ease-out",
                    riskScore >= 80 && "bg-destructive",
                    riskScore >= 60 && riskScore < 80 && "bg-warning",
                    riskScore >= 40 && riskScore < 60 && "bg-accent",
                    riskScore < 40 && "bg-success"
                  )}
                  style={{ width: `${animatedScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 text-center">
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskGauge;