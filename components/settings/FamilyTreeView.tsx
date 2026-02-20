'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RELATIONSHIP_INVERSE_MAP } from '@/lib/constants'
import type { StoryProfile, ProfileRelationship } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FamilyTreeViewProps {
  protagonist: StoryProfile | null
  profiles: StoryProfile[]
  relationships: ProfileRelationship[]
  onAddRelative: (fromProfileId: string) => void
  onEditProfile: (profile: StoryProfile) => void
}

interface TreeNode {
  profile: StoryProfile
  relationLabel: string
}

interface FamilyGraph {
  parents: TreeNode[]
  grandparents: TreeNode[]
  auntsUncles: TreeNode[]
  spouse: TreeNode | null
  siblings: TreeNode[]
  children: TreeNode[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build initials from a name string. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
}

/**
 * Given a protagonist id, find all profiles connected to them via a specific
 * relationship type. Handles both directions using the inverse map.
 *
 * For "parent": we want edges where someone IS a parent OF the protagonist.
 *   - from_profile_id = X, to_profile_id = protagonist, type = parent  (X is parent of protagonist)
 *   - from_profile_id = protagonist, to_profile_id = X, type = child   (protagonist is child of X => X is parent)
 *
 * For "child": we want edges where the protagonist IS a parent OF someone.
 *   - from_profile_id = protagonist, to_profile_id = X, type = parent  (protagonist is parent of X)
 *   - from_profile_id = X, to_profile_id = protagonist, type = child   (X is child of protagonist => protagonist is parent)
 *   Wait -- that means X is the child. We want the child's id.
 *
 * This helper returns the *other* profile's id for each matching edge.
 */
function findRelatedIds(
  relationships: ProfileRelationship[],
  subjectId: string,
  wantedRole: 'parent' | 'sibling' | 'spouse' | 'child',
): string[] {
  const ids: string[] = []
  const inverse = RELATIONSHIP_INVERSE_MAP[wantedRole] // e.g. parent -> child

  for (const rel of relationships) {
    if (rel.from_profile_id === subjectId) {
      // rel says: subject --type--> other
      // If type matches inverse, the OTHER has the wantedRole relative to subject.
      // e.g. wantedRole=parent, inverse=child. If type=child that means subject is child of other? No.
      // Actually the edge semantics: from --type--> to means "from IS type OF to".
      // So from=subject, type=parent means subject IS parent OF to => to is child.
      // We want "parent OF subject", i.e. someone whose role relative to subject is "parent".
      //
      // If from=subject, type=parent => subject is parent of to => to is child of subject.
      //   If wantedRole=child, this matches => otherId = to
      // If from=subject, type=child => subject is child of to => to is parent of subject.
      //   If wantedRole=parent, this matches => otherId = to
      //
      // General rule: from=subject, type=T => other(=to) has role inverse(T) relative to subject.
      // We want wantedRole, so we need inverse(T) == wantedRole => T == inverse(wantedRole) = inverse.
      // OR for symmetric: T == wantedRole.
      const inverseOfType = RELATIONSHIP_INVERSE_MAP[rel.relationship_type]
      if (inverseOfType === wantedRole || rel.relationship_type === wantedRole) {
        // But we need to be careful: for asymmetric types, only inverseOfType matters.
        // from=subject, type=T => to has role inverseOfType.
        // So this matches if inverseOfType === wantedRole.
        // For symmetric (sibling, spouse, friend): inverseOfType === T === wantedRole.
        if (inverseOfType === wantedRole) {
          ids.push(rel.to_profile_id)
        }
      }
    } else if (rel.to_profile_id === subjectId) {
      // rel says: other --type--> subject
      // from=other, type=T => subject has role inverse(T) relative to other.
      // That means other has role T relative to subject? No.
      // from IS type OF to. So other IS type OF subject.
      // So relative to subject, other's role is type.
      // We want wantedRole, so type === wantedRole.
      if (rel.relationship_type === wantedRole) {
        ids.push(rel.from_profile_id)
      } else {
        // Also handle if inverse of type matches via reverse direction.
        // Actually think again: from=other, type=T, to=subject.
        // Meaning: other IS T OF subject. So other's role is T.
        // e.g. other IS parent OF subject => other is parent.
        // wantedRole=parent => match. wantedRole=child => no match from this edge.
        // So just: rel.relationship_type === wantedRole.
        // But what about stored as 'child'? from=other, type=child, to=subject.
        // Means other IS child OF subject => other is child, subject is parent.
        // wantedRole=child => match (other is child of subject).
        // wantedRole=parent => no match.
        // That's already handled by rel.relationship_type === wantedRole.
        // Hmm but what if edge is stored as: from=subject, type=parent, to=other.
        // That's handled in the first branch. OK good.

        // Actually, let me reconsider for symmetric relationships.
        // from=other, type=sibling, to=subject. other IS sibling OF subject.
        // rel.relationship_type === 'sibling' === wantedRole => match. Good.

        // One more case: from=other, type=parent, to=subject. other IS parent OF subject.
        // wantedRole=parent => match (rel.type === wantedRole). Good.
        // wantedRole=child => no match. But we want children! Children are found when
        // from=other, type=child, to=subject (other is child of subject).
        // rel.type='child' === wantedRole='child' => match. Good.
        // OR from=subject, type=parent, to=other => inverseOfType='child'===wantedRole='child' => match. Good.
      }
    }
  }

  return Array.from(new Set(ids))
}

/** Look up a profile by id. */
function findProfile(profiles: StoryProfile[], id: string): StoryProfile | undefined {
  return profiles.find((p) => p.id === id)
}

/** Build the full family graph around the protagonist. */
function buildFamilyGraph(
  protagonist: StoryProfile,
  profiles: StoryProfile[],
  relationships: ProfileRelationship[],
): FamilyGraph {
  // Direct relations of protagonist
  const parentIds = findRelatedIds(relationships, protagonist.id, 'parent')
  const spouseIds = findRelatedIds(relationships, protagonist.id, 'spouse')
  const siblingIds = findRelatedIds(relationships, protagonist.id, 'sibling')
  const childIds = findRelatedIds(relationships, protagonist.id, 'child')

  const parents: TreeNode[] = parentIds
    .map((id) => findProfile(profiles, id))
    .filter((p): p is StoryProfile => !!p)
    .map((p) => ({ profile: p, relationLabel: 'Parent' }))

  const spouse: TreeNode | null = spouseIds.length > 0
    ? (() => {
        const p = findProfile(profiles, spouseIds[0])
        return p ? { profile: p, relationLabel: 'Spouse' } : null
      })()
    : null

  const siblings: TreeNode[] = siblingIds
    .map((id) => findProfile(profiles, id))
    .filter((p): p is StoryProfile => !!p)
    .map((p) => ({ profile: p, relationLabel: 'Sibling' }))

  const children: TreeNode[] = childIds
    .map((id) => findProfile(profiles, id))
    .filter((p): p is StoryProfile => !!p)
    .map((p) => ({ profile: p, relationLabel: 'Child' }))

  // Grandparents and aunts/uncles (from parents)
  const grandparents: TreeNode[] = []
  const auntsUncles: TreeNode[] = []

  for (const parent of parents) {
    const gpIds = findRelatedIds(relationships, parent.profile.id, 'parent')
    for (const gpId of gpIds) {
      const gp = findProfile(profiles, gpId)
      if (gp && !grandparents.some((n) => n.profile.id === gp.id)) {
        grandparents.push({ profile: gp, relationLabel: 'Grandparent' })
      }
    }

    const auIds = findRelatedIds(relationships, parent.profile.id, 'sibling')
    for (const auId of auIds) {
      const au = findProfile(profiles, auId)
      if (au && !auntsUncles.some((n) => n.profile.id === au.id)) {
        auntsUncles.push({ profile: au, relationLabel: 'Aunt / Uncle' })
      }
    }
  }

  return { parents, grandparents, auntsUncles, spouse, siblings, children }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TreeNodeCard({
  node,
  index,
  isProtagonist,
  onAddRelative,
  onEditProfile,
}: {
  node: TreeNode
  index: number
  isProtagonist?: boolean
  onAddRelative: (id: string) => void
  onEditProfile: (profile: StoryProfile) => void
}) {
  const { profile, relationLabel } = node

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className="flex flex-col items-center relative group"
    >
      {/* Clickable avatar + name */}
      <button
        type="button"
        onClick={() => onEditProfile(profile)}
        className={`
          flex flex-col items-center cursor-pointer rounded-xl p-2 transition-all duration-200
          hover:shadow-glow-sm hover:bg-ink-surface/30
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40
          ${isProtagonist ? 'ring-2 ring-accent-primary/50 bg-ink-surface/20 rounded-xl' : ''}
        `}
      >
        {/* Avatar circle */}
        <div
          className={`
            w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0
            flex items-center justify-center
            ${isProtagonist
              ? 'border-2 border-accent-primary shadow-glow-sm'
              : 'border-2 border-ink-border/40'
            }
            ${profile.portrait_url ? '' : 'bg-accent-primary/20'}
          `}
        >
          {profile.portrait_url ? (
            <Image
              src={profile.portrait_url}
              alt={profile.name}
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="font-display font-bold text-accent-primary text-sm md:text-lg">
              {getInitials(profile.name)}
            </span>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-medium text-text-primary mt-1.5 text-center max-w-[80px] md:max-w-[100px] truncate">
          {profile.name}
        </p>

        {/* Relation label */}
        <p className="text-xs text-text-muted text-center">
          {isProtagonist ? 'You' : relationLabel}
        </p>
      </button>

      {/* Add relative button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onAddRelative(profile.id)
        }}
        className="
          w-6 h-6 rounded-full flex items-center justify-center
          bg-ink-surface/50 border border-ink-border/30
          hover:border-accent-primary hover:bg-accent-primary/10
          transition-all duration-200 mt-1
          opacity-0 group-hover:opacity-100 focus:opacity-100
        "
        title={`Add relative for ${profile.name}`}
      >
        <Plus className="w-3 h-3 text-text-muted" />
      </button>
    </motion.div>
  )
}

/** A vertical connector line between rows. */
function VerticalConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="w-0.5 h-6 bg-ink-border/30" />
    </div>
  )
}

/** A horizontal row of nodes with horizontal connector lines between them. */
function NodeRow({
  nodes,
  startIndex,
  onAddRelative,
  onEditProfile,
  protagonistNode,
  spouseNode,
  isProtagonistRow,
}: {
  nodes: TreeNode[]
  startIndex: number
  onAddRelative: (id: string) => void
  onEditProfile: (profile: StoryProfile) => void
  protagonistNode?: TreeNode | null
  spouseNode?: TreeNode | null
  isProtagonistRow?: boolean
}) {
  if (isProtagonistRow) {
    // Special layout: [siblings...] [PROTAGONIST -- spouse] [siblings...]  (not further siblings after spouse)
    // Actually spec says: [Siblings] [PROTAGONIST + Spouse] [Siblings]
    // We'll render: siblings on left, protagonist+spouse center, siblings on right
    const leftSiblings = nodes.slice(0, Math.ceil(nodes.length / 2))
    const rightSiblings = nodes.slice(Math.ceil(nodes.length / 2))

    const allItems: { node: TreeNode; isProtagonist: boolean; isSpouse: boolean }[] = []

    for (const s of leftSiblings) {
      allItems.push({ node: s, isProtagonist: false, isSpouse: false })
    }
    if (protagonistNode) {
      allItems.push({ node: protagonistNode, isProtagonist: true, isSpouse: false })
    }
    if (spouseNode) {
      allItems.push({ node: spouseNode, isProtagonist: false, isSpouse: true })
    }
    for (const s of rightSiblings) {
      allItems.push({ node: s, isProtagonist: false, isSpouse: false })
    }

    return (
      <div className="flex items-start justify-center gap-2 md:gap-4 relative">
        {allItems.map((item, i) => {
          const globalIdx = startIndex + i
          // Determine if we need a spouse connector (dashed gold line between protagonist and spouse)
          const showSpouseConnector = item.isProtagonist && spouseNode

          return (
            <div key={item.node.profile.id} className="flex items-start">
              <TreeNodeCard
                node={item.node}
                index={globalIdx}
                isProtagonist={item.isProtagonist}
                onAddRelative={onAddRelative}
                onEditProfile={onEditProfile}
              />
              {showSpouseConnector && (
                <div className="flex items-center self-center mt-4 md:mt-5">
                  <div className="w-4 md:w-8 border-t-2 border-dashed border-accent-primary/40" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Generic row (parents, grandparents, children, aunts/uncles)
  if (nodes.length === 0) return null

  return (
    <div className="flex items-start justify-center gap-2 md:gap-4">
      {nodes.length > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-0 hidden" />
      )}
      {nodes.map((node, i) => (
        <div key={node.profile.id} className="flex items-start">
          {/* Horizontal connector between siblings in the same row */}
          {i > 0 && (
            <div className="flex items-center self-center mt-4 md:mt-5 -ml-1 md:-ml-2">
              <div className="w-2 md:w-4 border-t-2 border-ink-border/30" />
            </div>
          )}
          <TreeNodeCard
            node={node}
            index={startIndex + i}
            onAddRelative={onAddRelative}
            onEditProfile={onEditProfile}
          />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FamilyTreeView({
  protagonist,
  profiles,
  relationships,
  onAddRelative,
  onEditProfile,
}: FamilyTreeViewProps) {
  const graph = useMemo(() => {
    if (!protagonist) return null
    return buildFamilyGraph(protagonist, profiles, relationships)
  }, [protagonist, profiles, relationships])

  // Empty state: no protagonist or no family relationships at all
  if (!protagonist || !graph) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-ink-surface/50 border border-ink-border/30 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-sm text-text-muted mb-4">No family connections yet</p>
      </div>
    )
  }

  const hasAnyFamily =
    graph.parents.length > 0 ||
    graph.grandparents.length > 0 ||
    graph.auntsUncles.length > 0 ||
    graph.spouse !== null ||
    graph.siblings.length > 0 ||
    graph.children.length > 0

  if (!hasAnyFamily) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-ink-surface/50 border border-ink-border/30 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-sm text-text-muted mb-4">No family connections yet</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddRelative(protagonist.id)}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add your first family member
        </Button>
      </div>
    )
  }

  // Compute running index for stagger delays
  let idx = 0

  const gpStart = idx
  idx += graph.grandparents.length

  const auStart = idx
  idx += graph.auntsUncles.length

  const parentStart = idx
  idx += graph.parents.length

  const protagonistStart = idx
  idx += 1 + (graph.spouse ? 1 : 0) + graph.siblings.length

  const childStart = idx

  const protagonistNode: TreeNode = {
    profile: protagonist,
    relationLabel: 'You',
  }

  return (
    <div className="overflow-x-auto pb-4 -mx-2 px-2">
      <div className="flex flex-col items-center min-w-fit">
        {/* Grandparents row */}
        {graph.grandparents.length > 0 && (
          <>
            <div className="mb-1">
              <p className="text-[10px] text-text-muted/60 uppercase tracking-widest text-center font-ui">
                Grandparents
              </p>
            </div>
            <NodeRow
              nodes={graph.grandparents}
              startIndex={gpStart}
              onAddRelative={onAddRelative}
              onEditProfile={onEditProfile}
            />
            <VerticalConnector />
          </>
        )}

        {/* Aunts/Uncles + Parents row */}
        {(graph.parents.length > 0 || graph.auntsUncles.length > 0) && (
          <>
            <div className="mb-1">
              <p className="text-[10px] text-text-muted/60 uppercase tracking-widest text-center font-ui">
                {graph.auntsUncles.length > 0 ? 'Parents & Aunts/Uncles' : 'Parents'}
              </p>
            </div>
            <NodeRow
              nodes={[...graph.parents, ...graph.auntsUncles.map(au => ({ ...au, relationLabel: 'Aunt / Uncle' }))]}
              startIndex={parentStart}
              onAddRelative={onAddRelative}
              onEditProfile={onEditProfile}
            />
            <VerticalConnector />
          </>
        )}

        {/* Protagonist row (with spouse + siblings) */}
        <div className="mb-1">
          <p className="text-[10px] text-text-muted/60 uppercase tracking-widest text-center font-ui">
            {graph.siblings.length > 0 ? 'You & Siblings' : 'You'}
          </p>
        </div>
        <NodeRow
          nodes={graph.siblings}
          startIndex={protagonistStart}
          onAddRelative={onAddRelative}
          onEditProfile={onEditProfile}
          protagonistNode={protagonistNode}
          spouseNode={graph.spouse}
          isProtagonistRow
        />

        {/* Children row */}
        {graph.children.length > 0 && (
          <>
            <VerticalConnector />
            <div className="mb-1">
              <p className="text-[10px] text-text-muted/60 uppercase tracking-widest text-center font-ui">
                Children
              </p>
            </div>
            <NodeRow
              nodes={graph.children}
              startIndex={childStart}
              onAddRelative={onAddRelative}
              onEditProfile={onEditProfile}
            />
          </>
        )}
      </div>
    </div>
  )
}
