'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, UserX, Shield, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/admin-api'
import { toast } from 'sonner'
import { useI18n } from '@/components/providers/i18n-provider'

interface User {
  id: number
  email: string
  is_admin: boolean
  is_active: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    setLoading(true)
    adminApi.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleAdmin = async (user: User) => {
    try {
      await adminApi.updateUser(user.id, { is_admin: !user.is_admin })
      toast.success(`${user.email} ${user.is_admin ? 'removed from' : 'made'} admin`)
      fetchUsers()
    } catch { toast.error(t('error')) }
  }

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return
    try {
      await adminApi.deleteUser(user.id)
      toast.success(t('delete'))
      fetchUsers()
    } catch { toast.error(t('error')) }
  }

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('adminUsersTitle')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminUsersSubtitle')}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
        <Input
          placeholder={t('adminSearchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={isRtl ? 'pr-9' : 'pl-9'}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminID')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>Email</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminRole')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminStatus')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminJoined')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'} text-xs font-semibold text-muted-foreground`}>{t('adminActions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">{t('loading')}</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <UserX className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium">{t('adminNoUsersFound')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('adminNoUsersDesc')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.is_admin
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.is_admin ? t('adminRoleAdmin') : t('adminRoleUser')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {user.is_active ? t('adminActive') : t('adminInactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAdmin(user)}
                        title={user.is_admin ? t('adminRemoveAdmin') : t('adminMakeAdmin')}
                      >
                        {user.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(user)}
                        title={t('delete')}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
