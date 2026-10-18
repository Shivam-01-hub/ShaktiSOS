import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BatteryCharging, Bell, Camera, Check, ChevronRight, CircleHelp, ContactRound, Cpu,
  Gauge, HeartHandshake, History, Home, KeyRound, LogOut, MapPin, Menu, Plus, Radio, Settings, ShieldCheck,
  Signal, Siren, Smartphone, Trash2, Video, Wifi, X,
} from 'lucide-react';
import { appendSimulatedLocation, createDemoAlert, demoLocation } from './services/sosService';
import { createEvidence, progressEvidence, requestCameraPermission } from './services/evidenceService';
import { authenticate, registerUser, resetDemoData, storage } from './services/storage';
import type { AlertClassification, AlertStatus, Device, EmergencyContact, MisuseEvent, SOSAlert, User } from './types';

type Screen = 'home' | 'contacts' | 'device' | 'history' | 'settings' | 'active' | 'operator';
const statusLabels: AlertStatus[] = ['RECEIVED', 'ACKNOWLEDGED', 'ASSISTANCE DISPATCHED', 'RESOLVED'];

function App() {
  const [user, setUser] = useState<User | null>(storage.session());
  const [screen, setScreen] = useState<Screen>(user?.role === 'operator' ? 'operator' : 'home');
  const [alerts, setAlerts] = useState<SOSAlert[]>(storage.alerts());
  const [device, setDevice] = useState<Device>(storage.device());
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [stealthActive, setStealthActive] = useState(false);

  const activeAlert = useMemo(() => alerts.find((alert) => alert.status !== 'RESOLVED' && alert.userId === user?.id), [alerts, user]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const alert = createDemoAlert(user?.id ?? 'user-1', device);
      const next = [alert, ...alerts];
      setAlerts(next); storage.saveAlerts(next); setCountdown(null); setScreen('active'); setToast('SOS sent. Your demo response workflow is active.');
      return;
    }
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, user, device, alerts]);

  useEffect(() => {
    if (!activeAlert || screen !== 'active') return;
    const timer = window.setInterval(() => {
      setAlerts((current) => {
        const latest = current.find((alert) => alert.id === activeAlert.id);
        if (!latest) return current;
        const updated = current.map((alert) => alert.id === latest.id ? appendSimulatedLocation(alert) : alert);
        storage.saveAlerts(updated);
        return updated;
      });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [activeAlert, screen]);

  if (!user) return <Auth onLogin={(next) => { setUser(next); setScreen(next.role === 'operator' ? 'operator' : 'home'); }} />;

  const navigate = (next: Screen) => { setScreen(next); setMenuOpen(false); };
  const signOut = () => { storage.saveSession(null); setUser(null); };
  const updateAlert = (nextAlert: SOSAlert) => {
    const next = alerts.map((alert) => alert.id === nextAlert.id ? nextAlert : alert);
    setAlerts(next); storage.saveAlerts(next);
  };
  const recordMisuse = (event: MisuseEvent) => storage.saveMisuse([event, ...storage.misuse()]);
  const activateStealth = (source: string) => {
    const alert = createDemoAlert(user.id, device);
    const next = [alert, ...alerts];
    setAlerts(next); storage.saveAlerts(next); setStealthActive(true); setScreen('home');
    setToast(`Stealth SOS active via ${source}. The normal screen remains visible.`);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate(user.role === 'operator' ? 'operator' : 'home')} aria-label="Go to home">
          <span className="brand-mark"><HeartHandshake size={22} /></span><span>Shakti<span>SOS</span></span>
        </button>
        <div className="topbar-right"><span className="privacy-pill"><ShieldCheck size={14} /> Privacy first</span><button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu /></button></div>
      </header>
      {menuOpen && <div className="menu-popover"><p>Signed in as <strong>{user.name}</strong></p>{user.role !== 'operator' && <button onClick={() => navigate('settings')}><Settings size={16} /> Settings</button>}<button onClick={signOut}><LogOut size={16} /> Sign out</button></div>}
      <main className="main-content">
        {user.role === 'operator' ? <OperatorDashboard alerts={alerts} onUpdate={updateAlert} /> : (
          <>
            {screen === 'home' && <HomeScreen user={user} activeAlert={activeAlert} stealthMode={stealthActive} device={device} onSos={() => setCountdown(5)} onNavigate={navigate} />}
            {screen === 'contacts' && <ContactsScreen user={user} />}
            {screen === 'device' && <DeviceScreen device={device} onChange={(next) => { setDevice(next); storage.saveDevice(next); }} />}
            {screen === 'active' && activeAlert && <ActiveEmergency alert={activeAlert} onUpdate={updateAlert} onClose={() => { updateAlert({ ...activeAlert, status: 'RESOLVED', auditHistory: [...activeAlert.auditHistory, { id: crypto.randomUUID(), alertId: activeAlert.id, action: 'Emergency closed', timestamp: new Date().toISOString() }] }); setStealthActive(false); setScreen('history'); }} />}
            {screen === 'history' && <HistoryScreen alerts={alerts.filter((alert) => alert.userId === user.id)} />}
            {screen === 'settings' && <SettingsScreen stealthActive={stealthActive} onStealthActivate={activateStealth} onExitStealth={() => { setStealthActive(false); setScreen('active'); }} onReset={() => { resetDemoData(); window.location.reload(); }} />}
          </>
        )}
      </main>
      {user.role !== 'operator' && <nav className="bottom-nav" aria-label="Primary navigation">
        <NavButton icon={<Home />} label="Home" active={screen === 'home' || screen === 'active'} onClick={() => navigate(activeAlert ? 'active' : 'home')} />
        <NavButton icon={<ContactRound />} label="Contacts" active={screen === 'contacts'} onClick={() => navigate('contacts')} />
        <NavButton icon={<Smartphone />} label="Device" active={screen === 'device'} onClick={() => navigate('device')} />
        <NavButton icon={<History />} label="History" active={screen === 'history'} onClick={() => navigate('history')} />
      </nav>}
      {countdown !== null && <div className="countdown-overlay" role="dialog" aria-modal="true" aria-label="SOS confirmation"><div className="countdown-card"><Siren size={34} /><p>Knowingly triggering a false SOS alert is prohibited. False alerts may result in account suspension, investigation, monetary penalties, fines, or legal action as permitted by applicable laws and regulations.</p><strong>{countdown}</strong><button className="button button-secondary" onClick={() => { const timestamp = new Date().toISOString(); setCountdown(null); recordMisuse({ id: crypto.randomUUID(), userId: user.id, kind: 'Accidental Trigger', action: 'SOS cancelled during countdown', timestamp }); setToast('SOS cancelled. No location was shared.'); }}>Cancel SOS</button><small>No location is shared until the countdown completes.</small></div></div>}
      {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast(null)} aria-label="Dismiss"><X size={16} /></button></div>}
    </div>
  );
}

function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('user@shaktisos.demo');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = mode === 'register' ? registerUser(name, email, password) : authenticate(email, password);
    if (!found) { setError(mode === 'register' ? 'An account with that email already exists.' : 'That email or password is not recognised. Try the demo credentials shown below.'); return; }
    storage.saveSession(found); onLogin(found);
  };
  return <div className="auth-page"><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark"><HeartHandshake /></span><span>Shakti<span>SOS</span></span></div><span className="eyebrow">YOUR SAFETY, YOUR TERMS</span><h1>{mode === 'login' ? 'Welcome back.' : 'Create your safe space.'}</h1><p className="muted">A private safety companion with help when you choose it.</p><form onSubmit={submit}>{mode === 'register' && <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarohi Sharma" /></label>}<label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <div className="error-message">{error}</div>}<button className="button button-primary full-width">{mode === 'login' ? 'Log in securely' : 'Create account'} <ChevronRight size={18} /></button></form><div className="demo-hint"><strong>Demo access</strong><br />User: user@shaktisos.demo / demo123<br />Operator: operator@shaktisos.demo / demo123</div><button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}</button></div></div>;
}

function HomeScreen({ user, activeAlert, stealthMode, device, onSos, onNavigate }: { user: User; activeAlert?: SOSAlert; stealthMode: boolean; device: Device; onSos: () => void; onNavigate: (screen: Screen) => void }) {
  return <><section className="welcome-row"><div><span className="eyebrow">TUESDAY, 18 OCTOBER</span><h1>Good evening,<br /><span>{user.name.split(' ')[0]}.</span></h1></div><div className="avatar">{user.name.charAt(0)}</div></section>{activeAlert && !stealthMode ? <button className="active-banner" onClick={() => onNavigate('active')}><span><span className="pulse-dot" /> Emergency mode active</span><ChevronRight /></button> : <section className="sos-card"><div className="sos-orbit orbit-one" /><div className="sos-orbit orbit-two" /><div className="sos-content"><span className="eyebrow light">{stealthMode ? 'QUIET MODE' : 'NEED HELP?'}</span><h2>{stealthMode ? 'Your screen looks normal.' : <>Press and hold<br />for SOS.</>}</h2><p>{stealthMode ? 'Emergency mode is running discreetly in the demo.' : 'Your location is only shared after activation.'}</p>{!stealthMode && <button className="sos-button" onClick={onSos} aria-label="Start SOS countdown"><Siren size={32} /><span>SOS</span></button>}</div></section>}<div className="privacy-note"><ShieldCheck size={18} /><span><strong>Privacy is on by default.</strong><br />No tracking, no broadcasting. You are in control.</span></div><section className="section-heading"><div><span className="eyebrow">YOUR SETUP</span><h2>Ready when you are</h2></div><button className="text-button" onClick={() => onNavigate('settings')}>Manage</button></section><div className="setup-grid"><SetupCard icon={<ContactRound />} title="Trusted contacts" value="2 contacts ready" onClick={() => onNavigate('contacts')} /><SetupCard icon={<Radio />} title={device.name} value={`${device.batteryLevel}% battery · ${device.signalStrength}`} onClick={() => onNavigate('device')} /></div><p className="demo-disclaimer"><CircleHelp size={14} /> Demo only. This app does not contact real emergency services.</p></>;
}

function SetupCard({ icon, title, value, onClick }: { icon: React.ReactNode; title: string; value: string; onClick: () => void }) { return <button className="setup-card" onClick={onClick}><span className="setup-icon">{icon}</span><span><strong>{title}</strong><small>{value}</small></span><ChevronRight size={17} /></button>; }

function ContactsScreen({ user }: { user: User }) {
  const [contacts, setContacts] = useState(storage.contacts().filter((contact) => contact.userId === user.id));
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const save = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; if (!/^\+?[0-9 ()-]{8,}$/.test(data.phone)) { setError('Enter a valid phone number.'); return; } const next = { id: editing?.id ?? `contact-${Date.now()}`, userId: user.id, name: data.name, phone: data.phone, relationship: data.relationship, email: data.email || undefined }; const all = storage.contacts().filter((contact) => contact.id !== next.id); storage.saveContacts([...all, next]); setContacts([...contacts.filter((contact) => contact.id !== next.id), next]); setShowForm(false); setEditing(null); setError(''); };
  const remove = (id: string) => { const next = contacts.filter((contact) => contact.id !== id); setContacts(next); storage.saveContacts([...storage.contacts().filter((contact) => contact.userId !== user.id), ...next]); };
  return <><PageHeader eyebrow="YOUR CIRCLE" title="Trusted contacts" action={<button className="button button-small button-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Add</button>} /><p className="muted">People who will be notified if you activate an SOS.</p><div className="contact-list">{contacts.map((contact) => <div className="contact-item" key={contact.id}><div className="contact-avatar">{contact.name.charAt(0)}</div><div className="contact-info"><strong>{contact.name}</strong><span>{contact.relationship} · {contact.phone}</span>{contact.email && <small>{contact.email}</small>}</div><button className="icon-button" onClick={() => { setEditing(contact); setShowForm(true); }} aria-label={`Edit ${contact.name}`}><Settings size={17} /></button><button className="icon-button danger" onClick={() => remove(contact.id)} aria-label={`Remove ${contact.name}`}><Trash2 size={17} /></button></div>)}</div>{contacts.length === 0 && <EmptyState text="No trusted contacts yet." />}{showForm && <div className="modal-backdrop"><form className="modal-card" onSubmit={save}><div className="modal-heading"><h2>{editing ? 'Edit contact' : 'Add contact'}</h2><button type="button" className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X /></button></div><label>Name<input name="name" defaultValue={editing?.name} required /></label><label>Relationship<input name="relationship" defaultValue={editing?.relationship} required placeholder="Sister, friend..." /></label><label>Phone<input name="phone" defaultValue={editing?.phone} required /></label><label>Email <span className="muted">(optional)</span><input name="email" type="email" defaultValue={editing?.email} /></label>{error && <div className="error-message">{error}</div>}<button className="button button-primary full-width">Save contact</button></form></div>}</>;
}

function DeviceScreen({ device, onChange }: { device: Device; onChange: (device: Device) => void }) {
  const connected = device.pairingStatus === 'Paired';
  return <><PageHeader eyebrow="HARDWARE SIMULATOR" title="Your Shakti Beacon" /><div className="warning-box"><AlertTriangle size={19} /><span><strong>SIMULATED DEVICE</strong><br />Satellite communication shown here is simulated for demonstration purposes.</span></div><div className="device-visual"><div className="device-ring"><Radio size={44} /><span>SHakti</span></div><span className={`device-status ${connected ? 'online' : 'offline'}`}><span className="pulse-dot" /> {connected ? 'Paired & ready' : 'Not connected'}</span></div><div className="device-stats"><Stat icon={<BatteryCharging />} label="Battery" value={`${device.batteryLevel}%`} /><Stat icon={<Signal />} label="Signal" value={device.signalStrength} /><Stat icon={<Cpu />} label="Firmware" value={device.firmwareVersion} /></div><div className="button-row"><button className="button button-secondary" onClick={() => onChange({ ...device, pairingStatus: connected ? 'Not paired' : 'Paired' })}>{connected ? 'Disconnect' : 'Pair device'}</button><button className="button button-primary" onClick={() => onChange({ ...device, signalStrength: device.signalStrength === 'Strong' ? 'Weak' : 'Strong' })}><Wifi size={17} /> Check signal</button></div><p className="demo-disclaimer"><CircleHelp size={14} /> Physical SOS button, GPS, and satellite module are represented in this simulator.</p></>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="stat"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>; }

function ActiveEmergency({ alert, onUpdate, onClose }: { alert: SOSAlert; onUpdate: (alert: SOSAlert) => void; onClose: () => void }) {
  const addEvidence = async (kind: 'Photo' | 'Video') => {
    const permissionGranted = await requestCameraPermission();
    const recording = createEvidence(alert, kind);
    const withRecording = { ...alert, evidence: [...alert.evidence, recording], auditHistory: [...alert.auditHistory, { id: crypto.randomUUID(), alertId: alert.id, action: permissionGranted ? `${kind} evidence recording started` : `${kind} evidence failed: camera permission unavailable`, timestamp: recording.createdAt }] };
    if (!permissionGranted) {
      onUpdate({ ...withRecording, evidence: withRecording.evidence.map((item) => item.id === recording.id ? progressEvidence(item, 'Failed') : item) });
      return;
    }
    onUpdate(withRecording);
    window.setTimeout(() => onUpdate({ ...withRecording, evidence: withRecording.evidence.map((item) => item.id === recording.id ? progressEvidence(item, 'Uploading') : item) }), 250);
    window.setTimeout(() => onUpdate({ ...withRecording, evidence: withRecording.evidence.map((item) => item.id === recording.id ? progressEvidence(item, 'Uploaded') : item), auditHistory: [...withRecording.auditHistory, { id: crypto.randomUUID(), alertId: alert.id, action: `${kind} evidence uploaded (simulated)`, timestamp: new Date().toISOString() }] }), 700);
  };
  return <><div className="emergency-header"><div><span className="eyebrow">EMERGENCY MODE</span><h1>Help is on the way.</h1></div><span className="live-badge"><span className="pulse-dot" /> LIVE</span></div><div className="simulated-banner"><Radio size={18} /><strong>Location updates are simulated in demo mode. Video sharing is simulated in demo mode.</strong></div><div className="alert-id">ALERT ID <strong>{alert.id}</strong><span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className="map-card"><div className="map-grid"><span className="map-pin"><MapPin size={28} /></span><span className="map-label">Last known location</span></div><div className="coordinates"><strong>{alert.location.latitude.toFixed(4)}° N</strong><strong>{alert.location.longitude.toFixed(4)}° E</strong><small>Updated {new Date(alert.lastUpdatedAt).toLocaleTimeString()}</small></div></div><div className="status-grid"><StatusCard icon={<Bell />} label="Trusted contacts" status={alert.contactNotification} /><StatusCard icon={<Radio />} label="Satellite transmission" status={alert.satelliteTransmission} /><StatusCard icon={<BatteryCharging />} label="Device battery" status={`${alert.batteryLevel}%`} /></div><section className="evidence-panel"><div className="section-heading"><div><span className="eyebrow">EMERGENCY EVIDENCE</span><h2>Capture proof</h2></div><span className="status-chip">SIMULATED</span></div><p className="muted">Camera permission and network upload are simulated in this demo.</p><div className="button-row"><button className="button button-secondary" onClick={() => addEvidence('Photo')}><Camera size={17} /> Capture photo</button><button className="button button-secondary" onClick={() => addEvidence('Video')}><Video size={17} /> Record clip</button></div>{alert.evidence.length > 0 && <div className="evidence-list">{alert.evidence.map((item) => <div className="evidence-item" key={item.id}><span>{item.kind === 'Photo' ? <Camera size={16} /> : <Video size={16} />}</span><strong>{item.kind}</strong><small>{item.status}</small></div>)}</div>}</section><section className="timeline-section"><h2>What is happening</h2>{alert.auditHistory.slice(-4).reverse().map((item) => <div className="timeline-item" key={item.id}><span className="timeline-dot"><Check size={12} /></span><div><strong>{item.action}</strong><small>{new Date(item.timestamp).toLocaleTimeString()}</small></div></div>)}</section><button className="button button-secondary full-width close-button" onClick={onClose}>Close emergency</button></>;
}

function StatusCard({ icon, label, status }: { icon: React.ReactNode; label: string; status: string }) { const failed = status === 'Failed'; return <div className="status-card"><span>{icon}</span><small>{label}</small><strong className={failed ? 'text-danger' : ''}>{status}</strong></div>; }

function HistoryScreen({ alerts }: { alerts: SOSAlert[] }) { return <><PageHeader eyebrow="PRIVATE RECORD" title="Safe history" /><p className="muted">Your safety events, stored on this device.</p>{alerts.length === 0 ? <EmptyState text="No safety events recorded." /> : <div className="history-list">{alerts.map((alert) => <div className="history-item" key={alert.id}><span className="history-icon"><Activity size={18} /></span><div><strong>{alert.id}</strong><small>{new Date(alert.createdAt).toLocaleString()} · {alert.location.latitude.toFixed(3)}, {alert.location.longitude.toFixed(3)}</small></div><span className={`status-chip ${alert.status.toLowerCase().replaceAll(' ', '-')}`}>{alert.status}</span></div>)}</div>}</>; }

function SettingsScreen({ stealthActive, onStealthActivate, onExitStealth, onReset }: { stealthActive: boolean; onStealthActivate: (source: string) => void; onExitStealth: () => void; onReset: () => void }) {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const triggerPin = () => pin === '2580' ? onStealthActivate('secret PIN') : setMessage('Demo PIN rejected. Use 2580 for the simulator.');
  return <><PageHeader eyebrow="CONTROL CENTRE" title="Settings" /><div className="settings-list"><div className="setting-row"><span><ShieldCheck /> Privacy mode</span><strong className="text-success">Always on</strong></div><div className="setting-row"><span><Bell /> Contact notifications</span><strong>Enabled</strong></div><div className="setting-row"><span><Gauge /> Location sharing</span><strong>Only during SOS</strong></div><button className="setting-row button-reset" onClick={onReset}><span><Trash2 /> Reset demo data</span><ChevronRight /></button></div><section className="stealth-panel"><div className="section-heading"><div><span className="eyebrow">DISCREET ACCESS</span><h2>Stealth emergency mode</h2></div><KeyRound size={21} /></div><p className="muted">Demo-only controls model a secret PIN, secret gesture, and triple power-button press. A real mobile app would require OS-level integration and permissions.</p><div className="pin-row"><input aria-label="Secret emergency PIN" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Secret PIN" /><button className="button button-secondary" onClick={triggerPin}>Trigger PIN</button></div><button className="button button-secondary full-width" onClick={() => onStealthActivate('simulated triple power press')}>Simulate triple power press</button><button className="button button-secondary full-width" onClick={() => onStealthActivate('secret gesture')}>Simulate secret gesture</button>{stealthActive && <button className="button button-primary full-width" onClick={onExitStealth}>Open emergency controls</button>}{message && <div className="error-message">{message}</div>}</section><div className="privacy-panel"><ShieldCheck size={24} /><div><strong>Your data stays local</strong><p>This demonstration stores data in your browser only. It does not send data to external services.</p></div></div></>;
}

function OperatorDashboard({ alerts, onUpdate }: { alerts: SOSAlert[]; onUpdate: (alert: SOSAlert) => void }) {
  const [selected, setSelected] = useState<SOSAlert | null>(null);
  const active = alerts.filter((alert) => alert.status !== 'RESOLVED');
  const falseAlerts = alerts.filter((alert) => alert.classification === 'False Alert / Misuse').length;
  const accidentalTriggers = storage.misuse().filter((event) => event.kind === 'Accidental Trigger').length;
  const warnings = Math.min(falseAlerts, 1);
  const restriction = falseAlerts >= 2;
  const suspended = falseAlerts >= 3;
  const classify = (alert: SOSAlert, classification: AlertClassification) => {
    const next = { ...alert, classification, auditHistory: [...alert.auditHistory, { id: crypto.randomUUID(), alertId: alert.id, action: `Operator classified: ${classification}`, timestamp: new Date().toISOString() }] };
    onUpdate(next); setSelected(next);
  };
  return <><div className="operator-heading"><div><span className="eyebrow">RESPONSE CENTRE</span><h1>Good evening, operator.</h1><p className="muted">Monitor simulated alerts. No real dispatch is performed.</p></div><span className="operator-badge"><ShieldCheck size={15} /> OPERATOR</span></div><div className="operator-stats"><Stat icon={<Siren />} label="Active alerts" value={String(active.length)} /><Stat icon={<Check />} label="Resolved today" value={String(alerts.filter((alert) => alert.status === 'RESOLVED').length)} /><Stat icon={<Activity />} label="System status" value="Online" /></div><div className="misuse-dashboard"><h2>False SOS accountability</h2><div className="misuse-grid"><Stat icon={<AlertTriangle />} label="Total false alerts" value={String(falseAlerts)} /><Stat icon={<Bell />} label="Warning count" value={String(warnings)} /><Stat icon={<ShieldCheck />} label="Restriction status" value={restriction ? 'Restricted' : 'Clear'} /><Stat icon={<ShieldCheck />} label="Suspension status" value={suspended ? 'Suspended' : 'Clear'} /><Stat icon={<Activity />} label="Accidental triggers" value={String(accidentalTriggers)} /></div><small>Warnings and restrictions are demo workflow states only. No fines or legal penalties are automatically imposed.</small></div><div className="operator-table-wrap"><div className="section-heading"><div><span className="eyebrow">LIVE QUEUE</span><h2>Active alerts</h2></div><span className="live-badge"><span className="pulse-dot" /> LIVE</span></div>{active.length === 0 ? <EmptyState text="No active alerts. The response queue is clear." /> : <div className="alert-table">{active.map((alert) => <button className="alert-row" key={alert.id} onClick={() => setSelected(alert)}><strong>{alert.id}</strong><span>Aarohi Sharma</span><span>{new Date(alert.createdAt).toLocaleTimeString()}</span><span>{alert.location.latitude.toFixed(3)}, {alert.location.longitude.toFixed(3)}</span><span className={`status-chip ${alert.status.toLowerCase().replaceAll(' ', '-')}`}>{alert.status}</span><ChevronRight size={17} /></button>)}</div>}</div>{selected && <div className="modal-backdrop"><div className="modal-card drawer"><div className="modal-heading"><div><span className="eyebrow">ALERT DETAIL</span><h2>{selected.id}</h2></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X /></button></div><div className="detail-grid"><span>Current status</span><strong>{selected.status}</strong><span>Coordinates</span><strong>{selected.location.latitude.toFixed(5)}, {selected.location.longitude.toFixed(5)}</strong><span>Contact notification</span><strong>{selected.contactNotification}</strong><span>Satellite simulation</span><strong>{selected.satelliteTransmission}</strong><span>Classification</span><strong>{selected.classification ?? 'Unclassified'}</strong></div><h3>Evidence</h3>{selected.evidence.length === 0 ? <p className="muted">No evidence uploaded.</p> : selected.evidence.map((item) => <div className="evidence-item" key={item.id}><span>{item.kind === 'Photo' ? <Camera size={16} /> : <Video size={16} />}</span><strong>{item.kind}</strong><small>{item.status} · simulated</small></div>)}<h3>Classify alert</h3><div className="classification-row">{(['Genuine Emergency', 'Accidental Trigger', 'False Alert / Misuse'] as AlertClassification[]).map((classification) => <button className="button button-secondary" key={classification} onClick={() => classify(selected, classification)}>{classification}</button>)}</div><h3>Audit timeline</h3>{selected.auditHistory.map((item) => <div className="timeline-item" key={item.id}><span className="timeline-dot"><Check size={12} /></span><div><strong>{item.action}</strong><small>{new Date(item.timestamp).toLocaleString()}</small></div></div>)}<div className="button-row operator-actions">{statusLabels.slice(1, 3).map((status) => <button key={status} className="button button-secondary" disabled={selected.status === status || selected.status === 'RESOLVED'} onClick={() => { const next = { ...selected, status, auditHistory: [...selected.auditHistory, { id: crypto.randomUUID(), alertId: selected.id, action: `Operator: ${status.toLowerCase()}`, timestamp: new Date().toISOString() }] }; onUpdate(next); setSelected(next); }}>{status === 'ACKNOWLEDGED' ? 'Acknowledge' : 'Dispatch assistance'}</button>)}<button className="button button-primary" onClick={() => { const next = { ...selected, status: 'RESOLVED' as const, auditHistory: [...selected.auditHistory, { id: crypto.randomUUID(), alertId: selected.id, action: 'Operator: incident resolved', timestamp: new Date().toISOString() }] }; onUpdate(next); setSelected(null); }}>Resolve incident</button></div></div></div>}</>; }

function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action}</div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><CircleHelp size={24} /><p>{text}</p></div>; }
function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) { return <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>{icon}<span>{label}</span></button>; }

export default App;
