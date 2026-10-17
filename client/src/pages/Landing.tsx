import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Compass, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-between p-6 sm:p-10 lg:p-16">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-8 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-indigo/15 border border-accent-indigo/30 flex items-center justify-center text-accent-indigo">
            <Activity className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-mono text-base font-semibold tracking-wider text-text-primary">
            RESONANCE
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              Open Dashboard
            </Button>
          </Link>
          <Link to="/log">
            <Button size="sm">
              Log Moment
            </Button>
          </Link>
        </nav>
      </header>

      {/* Main Monastic Hero */}
      <main className="max-w-4xl mx-auto py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-subtle border border-border-subtle text-xs font-mono text-text-secondary">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" aria-hidden="true" />
          <span>Academic Research Instrument &bull; UI/UX & NoSQL</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-text-primary leading-tight">
          A quiet instrument for noticing patterns in your work.
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Log contextual sessions capturing your environment, activity, and personal state.
          Discover which working conditions correlate with your highest self-reported focus.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to="/dashboard">
            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Explore Your Dashboard
            </Button>
          </Link>
          <Link to="/log">
            <Button variant="outline" size="lg">
              Log a Moment
            </Button>
          </Link>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left">
          <Card padding="md" className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo mb-3">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">
              Sub-30s Moment Capture
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Record location, noise, lighting, and presence alongside self-reported focus and energy.
            </p>
          </Card>

          <Card padding="md" className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center text-accent-amber mb-3">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">
              Environmental Resonance Map
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Explore multi-dimensional environmental combinations powered by live MongoDB aggregation.
            </p>
          </Card>

          <Card padding="md" className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center text-accent-teal mb-3">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">
              Time & Distraction Insights
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Inspect time-of-day hourly distributions and quantified distraction delta comparisons.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary font-mono">
        <div>RESONANCE &mdash; NoSQL Aggregation &amp; Cognitive UI/UX Evaluation</div>
        <div>Asia/Kolkata Reference Timezone</div>
      </footer>
    </div>
  );
};
