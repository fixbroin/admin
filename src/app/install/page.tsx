
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database, User, ShieldCheck, Rocket, Loader2 } from 'lucide-react';
import { runInstallation } from './actions';
import { useRouter } from 'next/navigation';

export default function InstallPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState(1);

    const [dbConfig, setDbConfig] = useState({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'cineelite'
    });

    const [adminUser, setAdminUser] = useState({
        username: 'admin',
        email: '',
        password: ''
    });

    const handleInstall = () => {
        if (!adminUser.password || !adminUser.email) {
            toast({ variant: 'destructive', title: 'Required Fields', description: 'Please complete all admin user details.' });
            return;
        }

        startTransition(async () => {
            const result = await runInstallation({ dbConfig, adminUser });
            if (result.success) {
                toast({ title: 'Success!', description: 'Installation complete. Redirecting...' });
                router.push('/admin/login');
            } else {
                toast({ variant: 'destructive', title: 'Installation Failed', description: result.error });
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 mb-4">
                        <Rocket className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">CineElite <span className="text-primary text-primary">Setup</span></h1>
                    <p className="text-muted-foreground font-medium text-lg">Initialize your self-hosted platform in minutes.</p>
                </div>

                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full bg-primary transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                    </div>
                </div>

                {step === 1 ? (
                    <Card className="border-none shadow-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-border pb-6">
                            <CardTitle className="flex items-center gap-2"><Database className="text-primary h-5 w-5" /> Database Configuration</CardTitle>
                            <CardDescription>Enter your MySQL database connection details.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-4 text-foreground">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest ml-1">Host</label>
                                    <Input value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} placeholder="localhost" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest ml-1">Database Name</label>
                                    <Input value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} placeholder="cineelite" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest ml-1">User</label>
                                    <Input value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} placeholder="root" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest ml-1">Password</label>
                                    <Input type="password" value={dbConfig.password} onChange={e => setDbConfig({...dbConfig, password: e.target.value})} placeholder="••••••••" />
                                </div>
                            </div>
                            <Button className="w-full h-12 text-lg font-bold mt-4" onClick={() => setStep(2)}>Next Step</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-border pb-6">
                            <CardTitle className="flex items-center gap-2"><User className="text-primary h-5 w-5" /> Admin Account</CardTitle>
                            <CardDescription>Create your primary administrator account.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-4 text-foreground">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest ml-1">Admin Username</label>
                                <Input value={adminUser.username} onChange={e => setAdminUser({...adminUser, username: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest ml-1">Admin Email</label>
                                <Input type="email" value={adminUser.email} onChange={e => setAdminUser({...adminUser, email: e.target.value})} placeholder="admin@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest ml-1">Admin Password</label>
                                <Input type="password" value={adminUser.password} onChange={e => setAdminUser({...adminUser, password: e.target.value})} placeholder="••••••••" />
                            </div>
                            
                            <div className="flex gap-4 pt-4 text-foreground">
                                <Button variant="outline" className="flex-1 h-12 font-bold" onClick={() => setStep(1)} disabled={isPending}>Back</Button>
                                <Button className="flex-[2] h-12 font-bold text-lg" onClick={handleInstall} disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                    Finish Installation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
