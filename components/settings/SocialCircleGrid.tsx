'use client'

import { motion } from 'framer-motion'
import { Users, Briefcase, GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SOCIAL_CATEGORIES } from '@/lib/constants'
import type { StoryProfile, ProfileRelationship, RelationshipType } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface SocialCircleGridProps {
  profiles: StoryProfile[]
  relationships: ProfileRelationship[]
  protagonistId: string
  onAddPerson: (category: string) => void
  onEditRelationship: (relationship: ProfileRelationship) => void
  onDeleteRelationship: (id: string) => void
}

const categoryConfig: Record<string, { icon: LucideIcon; label: string; emptyLabel: string }> = {
  friend: { icon: Users, label: 'Friends', emptyLabel: 'No friends added yet' },
  colleague: { icon: Briefcase, label: 'Colleagues', emptyLabel: 'No colleagues added yet' },
  mentor: { icon: GraduationCap, label: 'Mentors', emptyLabel: 'No mentors added yet' },
}

function resolveConnectedProfile(
  relationship: ProfileRelationship,
  protagonistId: string,
  profiles: StoryProfile[]
): StoryProfile | undefined {
  const otherId = relationship.from_profile_id === protagonistId
    ? relationship.to_profile_id
    : relationship.from_profile_id
  return profiles.find(p => p.id === otherId)
}

export function SocialCircleGrid({
  profiles,
  relationships,
  protagonistId,
  onAddPerson,
  onEditRelationship,
  onDeleteRelationship,
}: SocialCircleGridProps) {
  // Filter to social types only and group by relationship_type
  const socialRelationships = relationships.filter(r =>
    (SOCIAL_CATEGORIES as readonly string[]).includes(r.relationship_type)
  )

  const grouped = SOCIAL_CATEGORIES.reduce<Record<string, ProfileRelationship[]>>((acc, category) => {
    acc[category] = socialRelationships.filter(r => r.relationship_type === category)
    return acc
  }, {} as Record<string, ProfileRelationship[]>)

  return (
    <div className="space-y-6">
      {SOCIAL_CATEGORIES.map((category, index) => {
        const config = categoryConfig[category]
        const Icon = config.icon
        const items = grouped[category] || []

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Group heading */}
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-ink-muted" />
              <h4 className="text-sm font-display font-semibold text-ink-text">
                {config.label}
              </h4>
              <span className="text-xs text-ink-muted ml-2">
                {items.length}
              </span>
            </div>

            {/* Empty state */}
            {items.length === 0 && (
              <p className="text-sm text-ink-muted mb-3">{config.emptyLabel}</p>
            )}

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(relationship => {
                const connectedProfile = resolveConnectedProfile(relationship, protagonistId, profiles)

                return (
                  <Card key={relationship.id} variant="glass" compact hover>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {/* Name */}
                        <p className="text-sm font-medium text-ink-text truncate">
                          {connectedProfile?.name ?? 'Unknown'}
                        </p>

                        {/* Relationship badge */}
                        <span className="inline-block bg-accent-primary/10 text-accent-primary text-xs px-2 py-0.5 rounded-full mt-1">
                          {config.label.slice(0, -1)}
                        </span>

                        {/* Custom label */}
                        {relationship.label && (
                          <p className="text-xs text-ink-muted italic mt-1">
                            {relationship.label}
                          </p>
                        )}

                        {/* Nickname */}
                        {connectedProfile?.nickname && (
                          <p className="text-xs text-ink-muted mt-1">
                            &ldquo;{connectedProfile.nickname}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onEditRelationship(relationship)}
                          className="p-1 rounded-md transition-colors"
                          aria-label="Edit relationship"
                        >
                          <Pencil className="w-4 h-4 text-ink-muted hover:text-ink-text" />
                        </button>
                        <button
                          onClick={() => onDeleteRelationship(relationship.id)}
                          className="p-1 rounded-md transition-colors"
                          aria-label="Delete relationship"
                        >
                          <Trash2 className="w-4 h-4 text-ink-muted hover:text-status-error" />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {/* Add button */}
              <div
                onClick={() => onAddPerson(category)}
                className="border border-dashed border-ink-border/30 hover:border-accent-primary/50 rounded-xl p-3 flex items-center justify-center text-sm text-ink-muted hover:text-accent-primary cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add {config.label.slice(0, -1).toLowerCase()}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
