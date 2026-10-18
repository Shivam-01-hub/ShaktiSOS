import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { hasPermission } from './core/access'
import {
  appendLocationPoint,
  appendSatelliteMessage,
  cancelCountdown,
  createCountdownSession,
  tickCountdown,
} from './core/sosEngine'
import { defaultContacts, defaultDeviceState, defaultProfile, demoUsers } from './data/seed'
import type { AuditEvent, DeviceState, EmergencyContact, EmergencySession, UserAccount, UserProfile } from './types'

const makeAudit = (actor: string, action: string, metadata?: string): AuditEvent => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  actor,
  action,
  metadata,
})

const createLocationPoint = (device: DeviceState) => {
  const latBase = 28.6139
  const lonBase = 77.209
  const variance = device.gpsAccuracy === 'high' ? 0.0008 : device.gpsAccuracy === 'medium' ? 0.002 : 0.004
  const lat = (latBase + (Math.random() - 0.5) * variance).toFixed(5)
  const lon = (lonBase + (Math.random() - 0.5) * variance).toFixed(5)
  return `${lat}, ${lon} (${device.gpsAccuracy} accuracy)`
}

function App() {
  const [email, setEmail] = useState('anika@shaktisos.app')
  const [password, setPassword] = useState('user123')
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [contacts, setContacts] = useState<EmergencyContact[]>(defaultContacts)
  const [deviceState, setDeviceState] = useState<DeviceState>(defaultDeviceState)
  const [session, setSession] = useState<EmergencySession | null>(null)
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [contactDraft, setContactDraft] = useState({ name: '', phone: '', relation: '' })

  const role = currentUser?.role
  const canTriggerSos = role ? hasPermission(role, 'sos:trigger') : false
  const canMonitor = role ? hasPermission(role, 'emergency:monitor') : false

  const addAudit = (action: string, metadata?: string) => {
    if (!currentUser) return
    setAudit((logs) => [makeAudit(currentUser.name, action, metadata), ...logs].slice(0, 30))
  }

  const onLogin = (event: FormEvent) => {
    event.preventDefault()
    const user = demoUsers.find((entry) => entry.email === email && entry.password === password)
    if (!user) {
      setAudit((logs) => [makeAudit('unknown', 'auth.failure', email), ...logs])
      return
    }

    setCurrentUser(user)
    setAudit((logs) => [makeAudit(user.name, 'auth.success', `Role: ${user.role}`), ...logs])
  }

  const onLogout = () => {
    if (currentUser) {
      setAudit((logs) => [makeAudit(currentUser.name, 'auth.logout'), ...logs])
    }
    setCurrentUser(null)
    setSession(null)
  }

  useEffect(() => {
    if (session?.status !== 'countdown' || !currentUser) return

    const timer = window.setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.status !== 'countdown') return prev
        const next = tickCountdown(prev)
        if (next.status === 'active') {
          setAudit((logs) => [makeAudit(currentUser.name, 'sos.activated', 'Countdown reached zero'), ...logs])
        }
        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [session?.status, currentUser])

  useEffect(() => {
    if (session?.status !== 'active' || !currentUser) return

    const simulator = window.setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.status !== 'active') return prev
        const location = createLocationPoint(deviceState)
        const relay = `Satellite relay ping from ${deviceState.connectivity} link at ${new Date().toLocaleTimeString()}`
        return appendLocationPoint(appendSatelliteMessage(prev, relay), location)
      })
    }, 4000)

    return () => window.clearInterval(simulator)
  }, [session?.status, currentUser, deviceState])

  const operatorViewData = useMemo(
    () =>
      session?.status === 'active'
        ? [
            {
              sessionId: session.id,
              userId: session.userId,
              startedAt: session.startedAt,
              lastLocation: session.locationTrail.at(-1) ?? 'Awaiting first location ping',
            },
          ]
        : [],
    [session],
  )

  return (
    <main className="app-shell">
      <header className="card">
        <h1>ShaktiSOS</h1>
        <p>Privacy-first women safety platform with simulated emergency infrastructure.</p>
      </header>

      {!currentUser ? (
        <section className="card">
          <h2>Authentication</h2>
          <form onSubmit={onLogin} className="stack">
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit">Sign in</button>
          </form>
          <small>Demo user: anika@shaktisos.app / user123 · Demo operator: operator@shaktisos.app / operator123</small>
        </section>
      ) : (
        <>
          <section className="card split">
            <div>
              <h2>Account</h2>
              <p>
                Signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
              </p>
            </div>
            <button type="button" onClick={onLogout} className="secondary">
              Sign out
            </button>
          </section>

          {canTriggerSos && (
            <>
              <section className="card">
                <h2>User profile</h2>
                <div className="grid">
                  <label>
                    Age range
                    <input
                      value={profile.ageRange}
                      onChange={(event) => setProfile((value) => ({ ...value, ageRange: event.target.value }))}
                    />
                  </label>
                  <label>
                    Blood group
                    <input
                      value={profile.bloodGroup}
                      onChange={(event) => setProfile((value) => ({ ...value, bloodGroup: event.target.value }))}
                    />
                  </label>
                  <label>
                    Privacy mode
                    <select
                      value={profile.privacyMode}
                      onChange={(event) =>
                        setProfile((value) => ({ ...value, privacyMode: event.target.value as UserProfile['privacyMode'] }))
                      }
                    >
                      <option value="strict">Strict (minimum data)</option>
                      <option value="standard">Standard</option>
                    </select>
                  </label>
                  <label>
                    Medical notes
                    <input
                      value={profile.medicalNotes}
                      onChange={(event) => setProfile((value) => ({ ...value, medicalNotes: event.target.value }))}
                    />
                  </label>
                </div>
                <button type="button" onClick={() => addAudit('profile.updated')}>
                  Save profile
                </button>
              </section>

              <section className="card">
                <h2>Emergency contacts</h2>
                <ul className="list">
                  {contacts.map((contact) => (
                    <li key={contact.id}>
                      <strong>{contact.name}</strong> · {contact.relation} · {contact.phone}
                    </li>
                  ))}
                </ul>
                <div className="grid">
                  <input
                    placeholder="Name"
                    value={contactDraft.name}
                    onChange={(event) => setContactDraft((draft) => ({ ...draft, name: event.target.value }))}
                  />
                  <input
                    placeholder="Phone"
                    value={contactDraft.phone}
                    onChange={(event) => setContactDraft((draft) => ({ ...draft, phone: event.target.value }))}
                  />
                  <input
                    placeholder="Relation"
                    value={contactDraft.relation}
                    onChange={(event) => setContactDraft((draft) => ({ ...draft, relation: event.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!contactDraft.name || !contactDraft.phone || !contactDraft.relation) return
                    const created = {
                      id: crypto.randomUUID(),
                      ...contactDraft,
                    }
                    setContacts((existing) => [...existing, created])
                    setContactDraft({ name: '', phone: '', relation: '' })
                    addAudit('contacts.added', created.name)
                  }}
                >
                  Add contact
                </button>
              </section>

              <section className="card">
                <h2>SOS workflow</h2>
                {!session || session.status === 'resolved' ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      const next = createCountdownSession(currentUser.id)
                      setSession(next)
                      addAudit('sos.countdown.started', `Session ${next.id}`)
                    }}
                  >
                    Trigger SOS (15s countdown)
                  </button>
                ) : null}

                {session?.status === 'countdown' ? (
                  <div className="panel warning">
                    <p>Emergency will activate in {session.countdownRemaining}s</p>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setSession((value) => (value ? cancelCountdown(value) : value))
                        addAudit('sos.cancelled')
                      }}
                    >
                      Cancel SOS
                    </button>
                  </div>
                ) : null}

                {session?.status === 'active' ? (
                  <div className="panel danger-bg">
                    <h3>Emergency active</h3>
                    <p>Satellite messaging and location updates are simulation-only.</p>
                    <p>Latest location: {session.locationTrail.at(-1) ?? 'Awaiting first location ping'}</p>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setSession((value) => (value ? { ...value, status: 'resolved' } : value))
                        addAudit('sos.resolved')
                      }}
                    >
                      Mark resolved
                    </button>
                    <ul className="list compact">
                      {session.satelliteMessages.slice(-4).map((message, index) => (
                        <li key={`${message}-${index}`}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              <section className="card">
                <h2>Device simulator</h2>
                <div className="grid">
                  <label>
                    Battery: {deviceState.battery}%
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={deviceState.battery}
                      onChange={(event) =>
                        setDeviceState((value) => ({ ...value, battery: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label>
                    Connectivity
                    <select
                      value={deviceState.connectivity}
                      onChange={(event) =>
                        setDeviceState((value) => ({
                          ...value,
                          connectivity: event.target.value as DeviceState['connectivity'],
                        }))
                      }
                    >
                      <option value="online">Online</option>
                      <option value="limited">Limited</option>
                      <option value="offline">Offline</option>
                    </select>
                  </label>
                  <label>
                    GPS accuracy
                    <select
                      value={deviceState.gpsAccuracy}
                      onChange={(event) =>
                        setDeviceState((value) => ({
                          ...value,
                          gpsAccuracy: event.target.value as DeviceState['gpsAccuracy'],
                        }))
                      }
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>
                </div>
              </section>
            </>
          )}

          {canMonitor && (
            <section className="card">
              <h2>Emergency operator dashboard</h2>
              {operatorViewData.length === 0 ? (
                <p>No active emergencies currently.</p>
              ) : (
                <ul className="list">
                  {operatorViewData.map((item) => (
                    <li key={item.sessionId}>
                      <strong>{item.sessionId}</strong> · user {item.userId}
                      <br />
                      Started {new Date(item.startedAt).toLocaleString()} · last location {item.lastLocation}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="card">
            <h2>Audit logs</h2>
            <ul className="list compact">
              {audit.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.action}</strong> by {entry.actor}
                  <br />
                  <small>{new Date(entry.timestamp).toLocaleString()}</small>
                  {entry.metadata ? <small> · {entry.metadata}</small> : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}

export default App
