'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card variant="glass" className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-4" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-2xl text-accent-primary mb-2">Check your email</h2>
          <p className="text-text-secondary">
            We sent a confirmation link to <span className="text-text-primary">{email}</span>
          </p>
        </motion.div>
      </Card>
    )
  }

  const stagger = {
    hidden: { opacity: 0, y: 10 },
    show: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.1 + i * 0.08, duration: 0.3 }
    }),
  }

  return (
    <Card variant="glass">
      <form onSubmit={handleSignup} className="space-y-4">
        <motion.div custom={0} initial="hidden" animate="show" variants={stagger}>
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should we call you?"
            required
          />
        </motion.div>
        <motion.div custom={1} initial="hidden" animate="show" variants={stagger}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="show" variants={stagger}>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-status-error">
            {error}
          </motion.p>
        )}
        <motion.div custom={3} initial="hidden" animate="show" variants={stagger}>
          <Button type="submit" isLoading={isLoading} className="w-full" variant="glow">
            Create Account
          </Button>
        </motion.div>
      </form>

      <motion.p
        custom={4} initial="hidden" animate="show" variants={stagger}
        className="mt-6 text-center text-sm text-text-secondary"
      >
        Already have an account?{' '}
        <Link href="/login" className="text-accent-primary hover:text-accent-primary/80 transition-colors">
          Sign in
        </Link>
      </motion.p>
    </Card>
  )
}
