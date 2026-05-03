import { useState } from "react";

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        setError("");

        if (mode === "register" && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setBusy(true);
        try {
            if (mode === "login") {
                await onLogin(email, password);
            } else {
                await onRegister(name, email, password);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Authentication failed.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card fade-in">
                <h1>CollabSync</h1>
                <p className="sub">Student Project Collaboration Platform</p>
                <div className="tab-bar" style={{ marginBottom: 16 }}>
                    <div className={`tab-item ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
                        Login
                    </div>
                    <div className={`tab-item ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>
                        Register
                    </div>
                </div>
                <div className="login-hint">
                    <strong>Demo Accounts:</strong><br />
                    Student: ali@uni.edu / student123<br />
                    Supervisor: noman@uni.edu / super123<br />
                    Admin: admin@uni.edu / admin123
                </div>
                {error && <div className="error-msg">{error}</div>}
                {mode === "register" && (
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="Your name" />
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="your@uni.edu" />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••" />
                </div>
                {mode === "register" && (
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input className="form-input" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••" />
                    </div>
                )}
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={handleSubmit} disabled={busy}>
                    {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </button>
            </div>
        </div>
    );
}
