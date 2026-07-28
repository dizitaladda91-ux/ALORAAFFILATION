import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Link2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import aloraLogo from '../assets/alora-radiance-logo.png';

const features = [
  { icon: Link2, title: 'Share with confidence', text: 'Create referral links that make every recommendation measurable.' },
  { icon: BarChart3, title: 'See what is working', text: 'Track clicks, conversions, commissions, and growth in one clear view.' },
  { icon: ShieldCheck, title: 'Built for momentum', text: 'A secure partner portal designed to keep your program moving.' },
];

export const Landing = () => (
  <main className="landing-page">
    <div className="landing-grid" aria-hidden="true" />
    <div className="landing-glow landing-glow-one" aria-hidden="true" />
    <div className="landing-glow landing-glow-two" aria-hidden="true" />

    <nav className="landing-nav">
      <Link className="landing-brand" to={ROUTES.HOME} aria-label="ALORA home">
        <img className="landing-brand-logo" src={aloraLogo} alt="ALORA Radiance" />
      </Link>
      <Link className="landing-login-link" to={ROUTES.LOGIN}>Login <ArrowRight size={16} /></Link>
    </nav>

    <section className="landing-hero">
      <div className="landing-copy">
        <p className="landing-eyebrow"><Sparkles size={15} /> Affiliate software, made personal</p>
        <h1>Turn every introduction into <span>growth.</span></h1>
        <p className="landing-subhead">ALORA gives ambitious affiliates and team leaders one beautiful place to share, track, and grow their partnerships.</p>
        <div className="landing-actions">
          <Link className="landing-cta landing-cta-primary" to={ROUTES.REGISTER}>Become an affiliate <ArrowRight size={18} /></Link>
          <Link className="landing-cta landing-cta-secondary" to={ROUTES.LOGIN}>Login to your account</Link>
        </div>
        <div className="landing-proof"><CheckCircle2 size={17} /> Your links, commissions, and network — all in one place.</div>
      </div>

      <div className="landing-visual" aria-label="ALORA dashboard preview">
        <div className="landing-orbit landing-orbit-one" /><div className="landing-orbit landing-orbit-two" />
        <div className="landing-dashboard">
          <div className="dashboard-topbar"><span className="dashboard-logo">A</span><span>Overview</span><span className="dashboard-avatar">JD</span></div>
          <div className="dashboard-content">
            <p className="dashboard-label">This month</p><p className="dashboard-amount">$8,420.50</p>
            <div className="dashboard-chart"><span /><span /><span /><span /><span /><span /><span /></div>
            <div className="dashboard-stats"><div><small>Clicks</small><strong>12.8k</strong></div><div><small>Conversions</small><strong>842</strong></div></div>
          </div>
        </div>
        <div className="landing-float-card landing-float-network"><Users size={18} /><span><strong>+24</strong> new partners</span></div>
        <div className="landing-float-card landing-float-earnings"><span className="earning-dot" /><span><strong>Commission earned</strong><small>+$1,280.00</small></span></div>
      </div>
    </section>

    <section className="landing-audiences" aria-label="Choose your role">
      <article className="landing-role landing-role-featured"><span className="landing-role-icon"><Users size={21} /></span><p>For team builders</p><h2>Super Affiliate</h2><span>Lead your network, see team performance, and grow together with every referral.</span><Link to={ROUTES.REGISTER}>Create Super Affiliate account <ArrowRight size={16} /></Link></article>
      <article className="landing-role"><span className="landing-role-icon"><Link2 size={21} /></span><p>For independent partners</p><h2>Affiliate</h2><span>Share your referral links, track conversions, and see your earnings grow in real time.</span><Link to={ROUTES.REGISTER}>Create Affiliate account <ArrowRight size={16} /></Link></article>
    </section>

    <section className="landing-features">
      {features.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={21} /></span><h2>{title}</h2><p>{text}</p></article>)}
    </section>
  </main>
);
