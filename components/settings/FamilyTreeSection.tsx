'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchRelationships, deleteRelationship } from '@/lib/relationships'
import { FamilyTreeView } from './FamilyTreeView'
import { SocialCircleGrid } from './SocialCircleGrid'
import { AddRelationshipModal } from './AddRelationshipModal'
import type { StoryProfile, ProfileRelationship } from '@/types'

export function FamilyTreeSection() {
  const [profiles, setProfiles] = useState<StoryProfile[]>([])
  const [relationships, setRelationships] = useState<ProfileRelationship[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preselectedFromId, setPreselectedFromId] = useState<string | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<ProfileRelationship | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    const [profilesResult, relationshipsResult] = await Promise.all([
      supabase
        .from('story_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at'),
      fetchRelationships(supabase, user.id),
    ])

    if (profilesResult.data) setProfiles(profilesResult.data)
    setRelationships(relationshipsResult)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const protagonist = profiles.find((p) => p.type === 'personal') ?? null

  // Family relationships: parent, sibling, spouse, child
  const familyRelationships = relationships.filter((r) =>
    ['parent', 'sibling', 'spouse', 'child'].includes(r.relationship_type)
  )

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleAddRelative(fromProfileId: string) {
    setPreselectedFromId(fromProfileId)
    setEditingRelationship(null)
    setIsModalOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleAddPerson(_category: string) {
    setPreselectedFromId(null)
    setEditingRelationship(null)
    setIsModalOpen(true)
  }

  function handleEditRelationship(rel: ProfileRelationship) {
    setEditingRelationship(rel)
    setPreselectedFromId(null)
    setIsModalOpen(true)
  }

  async function handleDeleteRelationship(id: string) {
    try {
      await deleteRelationship(supabase, id)
      await loadData()
    } catch (err) {
      console.error('Failed to delete relationship:', err)
    }
  }

  function handleModalSave() {
    loadData()
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setPreselectedFromId(null)
    setEditingRelationship(null)
  }

  function handleEditProfile(profile: StoryProfile) {
    // Profile editing is handled by StoryProfileSection — no-op here
    console.log('Edit profile (handled in Story Profiles section):', profile.name)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="text-center text-ink-muted py-8">Loading...</div>
    )
  }

  return (
    <>
      {/* Family Tree */}
      <FamilyTreeView
        protagonist={protagonist}
        profiles={profiles}
        relationships={familyRelationships}
        onAddRelative={handleAddRelative}
        onEditProfile={handleEditProfile}
      />

      {/* Separator */}
      <div className="border-t border-ink-border/20 my-6" />

      {/* Social Circle */}
      <SocialCircleGrid
        profiles={profiles}
        relationships={relationships}
        protagonistId={protagonist?.id ?? ''}
        onAddPerson={handleAddPerson}
        onEditRelationship={handleEditRelationship}
        onDeleteRelationship={handleDeleteRelationship}
      />

      {/* Add / Edit Relationship Modal */}
      <AddRelationshipModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleModalSave}
        profiles={profiles}
        userId={userId ?? ''}
        preselectedFromId={preselectedFromId ?? undefined}
        editingRelationship={editingRelationship}
      />
    </>
  )
}
