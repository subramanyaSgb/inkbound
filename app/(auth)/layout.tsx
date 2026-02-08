export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-accent-primary">Inkbound</h1>
          <p className="font-body text-text-secondary mt-2">Your life, bound in ink.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
