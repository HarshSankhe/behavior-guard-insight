import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { userAPI, UserProfile } from '@/lib/api';
import { User, Clock, Mouse, Keyboard, Wifi, Activity, Shield, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await userAPI.getProfile();
        setProfile(profileData);
      } catch (error) {
        toast({
          title: "Error Loading Profile",
          description: "Failed to load user profile data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <User className="h-12 w-12 text-primary animate-pulse mx-auto" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBehaviorScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-accent';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-cyber rounded-full flex items-center justify-center cyber-glow">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{profile.username}</h1>
          <p className="text-muted-foreground">User Behavioral Profile</p>
        </div>
        <div className="ml-auto">
          <Badge 
            variant="outline" 
            className={`${getBehaviorScoreColor(profile.behaviorScore)} border-current`}
          >
            <Shield className="h-3 w-3 mr-1" />
            Behavior Score: {profile.behaviorScore}%
          </Badge>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <User className="h-5 w-5 text-primary" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="font-medium text-card-foreground">{profile.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Device ID</span>
                <span className="font-mono text-sm text-card-foreground">{profile.deviceFingerprint}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Login</span>
                <span className="text-sm text-card-foreground">{formatDate(profile.lastLogin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Metrics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Activity className="h-5 w-5 text-accent" />
              <span>Behavioral Patterns</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Keyboard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Typing Speed</span>
                </div>
                <span className="font-medium text-card-foreground">{profile.typicalTypingSpeed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mouse className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Mouse Speed</span>
                </div>
                <span className="font-medium text-card-foreground">{profile.avgMouseSpeed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Network Latency</span>
                </div>
                <span className="font-medium text-card-foreground">{profile.networkLatencyRange}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Score */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Fingerprint className="h-5 w-5 text-primary" />
              <span>Security Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getBehaviorScoreColor(profile.behaviorScore)} cyber-glow`}>
                {profile.behaviorScore}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Confidence Score</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-cyber transition-all duration-1000"
                  style={{ width: `${profile.behaviorScore}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Based on keystroke dynamics, mouse patterns, and session behavior
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keystroke Dynamics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Keyboard className="h-5 w-5 text-accent" />
              <span>Keystroke Dynamics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-card-foreground">65</p>
                  <p className="text-sm text-muted-foreground">WPM Average</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-card-foreground">120ms</p>
                  <p className="text-sm text-muted-foreground">Dwell Time</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Key Hold Duration</span>
                  <span className="text-card-foreground">95ms ± 15ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Flight Time</span>
                  <span className="text-card-foreground">85ms ± 22ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Typing Rhythm</span>
                  <Badge variant="outline" className="text-success border-success">
                    Consistent
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mouse Dynamics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Mouse className="h-5 w-5 text-warning" />
              <span>Mouse Dynamics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-card-foreground">0.35</p>
                  <p className="text-sm text-muted-foreground">m/s Speed</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-card-foreground">2.1</p>
                  <p className="text-sm text-muted-foreground">Click Rate</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Movement Pattern</span>
                  <span className="text-card-foreground">Curved trajectories</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Acceleration</span>
                  <span className="text-card-foreground">0.15 m/s²</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Click Precision</span>
                  <Badge variant="outline" className="text-accent border-accent">
                    High
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <Clock className="h-5 w-5 text-primary" />
            <span>Recent Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2025-08-11 14:30', duration: '2h 15m', score: 95, status: 'Verified' },
              { date: '2025-08-11 09:45', duration: '1h 45m', score: 92, status: 'Verified' },
              { date: '2025-08-10 16:20', duration: '3h 10m', score: 88, status: 'Anomaly Detected' },
              { date: '2025-08-10 10:15', duration: '2h 30m', score: 94, status: 'Verified' },
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
                  <div>
                    <p className="font-medium text-card-foreground">{session.date}</p>
                    <p className="text-sm text-muted-foreground">Duration: {session.duration}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-card-foreground">Score: {session.score}%</span>
                  <Badge 
                    variant="outline" 
                    className={session.status === 'Verified' ? 'text-success border-success' : 'text-warning border-warning'}
                  >
                    {session.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;