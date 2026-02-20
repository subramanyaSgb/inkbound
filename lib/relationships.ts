import { SupabaseClient } from '@supabase/supabase-js'
import { ProfileRelationship } from '@/types'

export async function fetchRelationships(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRelationship[]> {
  const { data, error } = await supabase
    .from('profile_relationships')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function addRelationship(
  supabase: SupabaseClient,
  userId: string,
  fromProfileId: string,
  toProfileId: string,
  relationshipType: string,
  label?: string
): Promise<ProfileRelationship> {
  const { data, error } = await supabase
    .from('profile_relationships')
    .insert({
      user_id: userId,
      from_profile_id: fromProfileId,
      to_profile_id: toProfileId,
      relationship_type: relationshipType,
      label: label || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRelationship(
  supabase: SupabaseClient,
  id: string,
  updates: { relationship_type?: string; label?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('profile_relationships')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteRelationship(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('profile_relationships')
    .delete()
    .eq('id', id)
  if (error) throw error
}
