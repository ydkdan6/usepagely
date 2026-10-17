'use client'

import { useState } from 'react'
import { Apple, Eye, EyeOff, Globe, LockKeyhole, Mail, Sparkles } from 'lucide-react'

const artworkUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AApX9rQikYEunX9nJ7hPAZL996AdX3.png'

export default function Page() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  return (
    <main className="login-page">
      <header className="topbar">
        <a className="brand" href="#" aria-label="BookOnline home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>BookOnline</span>
        </a>
        <button className="language-switcher" type="button" aria-label="Language: English">
          <Globe aria-hidden="true" />
          <span>EN</span>
          <span className="flag" aria-hidden="true">🇬🇧</span>
        </button>
      </header>

      <section className="login-layout" aria-labelledby="login-title">
        <div className="art-panel" aria-label="A collage of classic book covers">
          <div className="glow glow-one" />
          <div className="glow glow-two" />
          <div className="book-art book-art-back">
            <img src={artworkUrl} alt="Classic illustrated book covers" />
          </div>
          <div className="book-art book-art-front">
            <img src={artworkUrl} alt="Classic illustrated book covers" />
          </div>
          <div className="art-caption"><Sparkles aria-hidden="true" /> Stories worth staying for</div>
        </div>

        <div className="form-panel">
          <div className="form-content">
            <div className="eyebrow">WELCOME BACK</div>
            <h1 id="login-title">Log in</h1>
            <p className="subheading">Continue your reading journey.</p>

            <div className="social-actions">
              <button className="social-button" type="button"><span className="google-g" aria-hidden="true">G</span>Log in using Google</button>
              <button className="social-button" type="button"><Apple aria-hidden="true" />Log in using Apple</button>
            </div>

            <div className="divider"><span /> <em>Or</em> <span /></div>

            <form onSubmit={(event) => event.preventDefault()}>
              <label className="field-label" htmlFor="email">Email</label>
              <div className="input-wrap">
                <Mail aria-hidden="true" />
                <input id="email" type="email" autoComplete="email" aria-label="Email" />
              </div>

              <label className="field-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <LockKeyhole aria-hidden="true" />
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-label="Password" />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>

              <div className="form-options">
                <label className="remember-label"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Stay signed in</span></label>
                <a href="#forgot">Forgot password?</a>
              </div>
              <button className="login-button" type="submit">Log in</button>
            </form>

            <p className="signup-prompt">Need an account? <a href="#create">Create one</a></p>
          </div>
        </div>
      </section>
    </main>
  )
}
