export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-4xl text-accent-primary mb-4">Inkbound</h1>
      <p className="font-body text-xl text-text-primary">Your life, bound in ink.</p>
      <p className="text-text-secondary mt-2">Secondary text</p>
      <p className="text-text-muted mt-2">Muted text</p>
      <div className="mt-6 p-6 bg-ink-card rounded-lg border border-ink-border">
        <p className="text-accent-primary">Card with accent</p>
      </div>
    </main>
  )
}
