import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          if (!fetchingRef.current) {
            fetchingRef.current = true
            await fetchProfile(currentUser)
            fetchingRef.current = false
          }
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(currentUser) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error) {
        // PGRST116 = no row found — auto-create the profile row
        if (error.code === 'PGRST116') {
          const newProfile = {
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            role: 'student',
            status: 'pending',
            profile_updated: false,
            password_changed: false,
          }
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()

          if (createError) {
            // Row may already exist due to race — try fetching again
            const { data: retry } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single()
            setProfile(retry || null)
          } else {
            setProfile(created)
          }
        } else {
          throw error
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-password`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isAdmin: profile?.role === 'admin',
      isStudent: profile?.role === 'student',
      signIn, signOut, resetPassword, updatePassword,
      refreshProfile, fetchProfile: (u) => fetchProfile(u || user),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}