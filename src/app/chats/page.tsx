'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, User, ChevronDown, LogOut, Settings, X, Sun, Moon, Pencil, Trash2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import ReactMarkdown from 'react-markdown'

interface Chat {
  id: number
  summary: string
  chats: {
    role: 'USER' | 'BOT'
    message: string
    loading?: boolean
  }[]
  email: string
}

interface UserData {
  name: string
  email: string
}

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  })
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    fetchChats()
    fetchUserData()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user')
      if (!res.ok) throw new Error('Failed to fetch user data')
      const data = await res.json()
      setUserData(data)
    } catch (error) {
      console.error('Error fetching user data:', error)
      router.push('/auth')
    }
  }

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats')
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const handleCreateNewChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `Chat ${new Date().toLocaleString()}`
        })
      })
      if (!res.ok) throw new Error('Failed to create chat')
      const newChat = await res.json()
      router.push(`/chat?id=${newChat.id}`)
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (!res.ok) throw new Error('Failed to update profile')
      const updatedUser = await res.json()
      setUserData(updatedUser)
      setEditingProfile(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleDeleteChat = async () => {
    if (deleteConfirm !== 'confirm' || !chatToDelete) return

    try {
      const res = await fetch(`/api/chats/${chatToDelete}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete chat')
      setChats(chats.filter(chat => chat.id !== chatToDelete))
    } catch (error) {
      console.error('Error deleting chat:', error)
    } finally {
      setShowDeleteModal(false)
      setChatToDelete(null)
      setDeleteConfirm('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#202123]">
      {/* Header */}
      <div className="bg-white dark:bg-[#2c2c2e] shadow-sm border-b dark:border-[#404040]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e8e8e8] font-quicksand">
              Your Chats
            </h1>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-[#404040] rounded-lg"
              >
                <User size={24} className="text-gray-500 dark:text-gray-400" />
                <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2c2c2e] rounded-lg shadow-lg py-1 z-30">
                  <div className="px-4 py-2 border-b dark:border-[#404040]">
                    <p className="text-sm font-semibold text-gray-800 dark:text-[#e8e8e8]">{userData?.name}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-[#d1d1d1]">{userData?.email}</p>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#d1d1d1] 
                      hover:bg-gray-100 dark:hover:bg-[#404040] flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#d1d1d1] 
                      hover:bg-gray-100 dark:hover:bg-[#404040] flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleCreateNewChat}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#e8e8e8] 
              bg-white dark:bg-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#505050] 
              transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            New Chat
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="group bg-white dark:bg-[#2c2c2e] rounded-lg p-4 shadow-sm hover:shadow-md 
                transition-shadow border border-gray-200 dark:border-[#404040] relative"
            >
              <div
                onClick={() => router.push(`/chat?id=${chat.id}`)}
                className="cursor-pointer"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-[#e8e8e8] mb-2 font-quicksand">
                  {chat.summary}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chat.chats.length} messages
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setChatToDelete(chat.id)
                  setShowDeleteModal(true)
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                  p-2 text-gray-400 hover:text-red-500 transition-all duration-200"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-[#e8e8e8] font-montserrat">
                Settings
              </h3>
              <button
                onClick={() => {
                  setShowSettings(false)
                  setEditingProfile(false)
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Theme Selection */}
              <div className="pb-6 border-b dark:border-[#404040]">
                <h4 className="text-sm font-medium text-gray-700 dark:text-[#e8e8e8] mb-4 font-montserrat">
                  Theme
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-lg flex items-center ${
                      theme === 'light' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#404040]'
                    }`}
                  >
                    <Sun size={18} />
                    <span className="ml-2 text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-lg flex items-center ${
                      theme === 'dark' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#404040]'
                    }`}
                  >
                    <Moon size={18} />
                    <span className="ml-2 text-sm font-medium">Dark</span>
                  </button>
                </div>
              </div>

              {/* Profile Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-[#e8e8e8] mb-4 font-montserrat">
                  Profile
                </h4>
                {editingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d1d1] mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full p-2 border dark:border-[#404040] rounded-lg 
                          bg-white dark:bg-[#404040] text-gray-900 dark:text-[#e8e8e8]
                          focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d1d1] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full p-2 border dark:border-[#404040] rounded-lg 
                          bg-white dark:bg-[#404040] text-gray-900 dark:text-[#e8e8e8]
                          focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                          hover:bg-gray-100 dark:hover:bg-[#404040] rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm text-white bg-blue-600 
                          hover:bg-blue-700 rounded-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg 
                      bg-gray-50 dark:bg-[#404040]">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-[#e8e8e8]">
                          {userData?.name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileData({
                            name: userData?.name || '',
                            email: userData?.email || ''
                          })
                          setEditingProfile(true)
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 
                          dark:hover:text-blue-300"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#404040]">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#e8e8e8]">
                        {userData?.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Delete Chat</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Type "confirm" to delete this chat. This action cannot be undone.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleDeleteChat()
            }}>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type 'confirm'"
                className="w-full p-2 border dark:border-[#404040] rounded-lg mb-4 
                  bg-white dark:bg-[#404040] text-gray-900 dark:text-[#e8e8e8]"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirm('')
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                    hover:bg-gray-100 dark:hover:bg-[#404040] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirm !== 'confirm'}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg 
                    hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}