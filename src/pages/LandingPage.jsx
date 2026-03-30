import { useNavigate } from 'react-router-dom';
import { Brain, Bell, ListTodo, Calendar, HardDrive, Mail, Mic, Image, Sparkles, ChevronRight } from 'lucide-react';
import Button from '../components/shared/Button';

const FEATURES = [
  { icon: Bell, title: 'Unlimited Reminders', desc: 'Never forget anything — set reminders by typing or speaking naturally' },
  { icon: Calendar, title: 'Calendar Sync', desc: 'Connect Google Calendar and manage events from chat' },
  { icon: HardDrive, title: 'Memory Vault', desc: 'Upload files and photos — AI organizes and searches them' },
  { icon: ListTodo, title: 'Smart Lists', desc: 'Create lists, add items, reorder with drag-and-drop' },
  { icon: Mail, title: 'Email Integration', desc: 'Read, classify, and draft emails with AI assistance' },
  { icon: Mic, title: 'Voice Input', desc: 'Speak your reminders and notes — AI transcribes them' },
  { icon: Image, title: 'Image Intelligence', desc: 'Send photos of menus, notes, schedules — AI extracts info' },
  { icon: Sparkles, title: 'Daily Briefing', desc: 'Start each day with an AI-generated summary' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain size={18} className="text-primary" />
            </div>
            <span className="font-bold text-lg text-text">MemorAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Log In
            </Button>
            <Button onClick={() => navigate('/auth?mode=signup')}>
              Try for Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
          <Brain size={40} className="text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-text mb-6 leading-tight">
          The memory layer above{' '}
          <span className="text-primary">all your apps</span>
        </h1>
        <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto">
          Set reminders, manage lists, sync calendars, and capture ideas — all
          through one AI chat interface.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => navigate('/auth?mode=signup')} className="text-lg px-8 py-3">
            Get Started Free <ChevronRight size={20} />
          </Button>
          <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            See How It Works
          </Button>
        </div>
      </section>

      {/* Pain Points */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            "You say 'I'll do it later' and it's gone forever",
            'A list in every app, none complete',
            'You forget simple errands you never wrote down',
            'Photos buried in camera roll, never seen again',
            'Infinite scrolling to find something you already had',
            'Important stuff spread across chats, emails, notes',
          ].map((pain, i) => (
            <div key={i} className="card text-center">
              <p className="text-sm text-text-muted">{pain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-text text-center mb-12">
          Everything you need to remember
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-text mb-1">{title}</h3>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-text text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Type or speak naturally', desc: '"Remind me to call mom tomorrow at 6pm"' },
            { step: '2', title: 'AI understands your intent', desc: 'Parses date, time, action, and context' },
            { step: '3', title: 'Done — it\'s remembered', desc: 'Reminders set, lists created, calendar updated' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-primary">{step}</span>
              </div>
              <h3 className="font-semibold text-text mb-1">{title}</h3>
              <p className="text-sm text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-text mb-4">
          Start remembering everything
        </h2>
        <p className="text-lg text-text-muted mb-8">
          Free forever. No credit card required.
        </p>
        <Button onClick={() => navigate('/auth?mode=signup')} className="text-lg px-8 py-3">
          Get Started Free <ChevronRight size={20} />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-primary" />
            <span>MemorAI</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-text transition-colors">Terms</a>
            <a href="#" className="hover:text-text transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
