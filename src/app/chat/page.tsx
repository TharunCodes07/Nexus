'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, Plus, Trash2, ChevronDown, LogOut, User, Pencil, Settings, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'

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

export default function ChatPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const { theme, setTheme } = useTheme()
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  })
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats()
    fetchUserData()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      const res = await fetch('/api/chats')
      if (!res.ok) throw new Error('Failed to fetch chats')
      const data = await res.json()
      setChats(data)
      if (!currentChat && data.length > 0) {
        setCurrentChat(data[0])
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const createNewChat = async () => {
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
      setChats([newChat, ...chats])
      setCurrentChat(newChat)
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)

    try {
      // If no current chat, create one first
      if (!currentChat) {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `Chat ${new Date().toLocaleString()}`
          })
        })
        if (!res.ok) throw new Error('Failed to create chat')
        const newChat = await res.json()
        setCurrentChat(newChat)
        setChats([newChat, ...chats])
      }

      const chatId = currentChat?.id || chats[0].id
      
      // Show user message immediately
      const userMessage = { role: 'USER' as const, message }
      const loadingMessage = { role: 'BOT' as const, message: '...', loading: true }
      
      setCurrentChat(prev => prev ? {
        ...prev,
        chats: [...prev.chats, userMessage, loadingMessage]
      } : null)
      
      setMessage('')

      // Send to API
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      if (!res.ok) throw new Error('Failed to send message')
      const updatedChat = await res.json()
      setCurrentChat(updatedChat)
      setChats(chats.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      ))
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
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
      if (currentChat?.id === chatToDelete) {
        setCurrentChat(chats[0] || null)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    } finally {
      setShowDeleteModal(false)
      setChatToDelete(null)
      setDeleteConfirm('')
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

  const handleUpdateTitle = async () => {
    if (!currentChat || !newTitle.trim()) return
    
    try {
      const res = await fetch(`/api/chats/${currentChat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: newTitle })
      })
      
      if (!res.ok) throw new Error('Failed to update title')
      const updatedChat = await res.json()
      
      setChats(chats.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      ))
      setCurrentChat(updatedChat)
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating chat title:', error)
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

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-[#202123]">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-64 bg-white dark:bg-[#2c2c2e] shadow-lg transition-transform duration-300 ease-in-out z-20`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b dark:border-[#404040] flex justify-between items-center">
            <button
              onClick={createNewChat}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#e8e8e8] 
                bg-gray-100 dark:bg-[#404040] rounded-lg hover:bg-gray-200 dark:hover:bg-[#505050] transition-colors"
            >
              <Plus size={16} className="mr-2" />
              New Chat
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer 
                  hover:bg-gray-100 dark:hover:bg-[#404040] 
                  ${currentChat?.id === chat.id ? 'bg-gray-100 dark:bg-[#404040]' : ''}`}
                onClick={() => setCurrentChat(chat)}
              >
                <span className="text-sm text-gray-700 dark:text-[#d1d1d1] font-medium truncate flex-1">
                  {chat.summary}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setChatToDelete(chat.id)
                    setShowDeleteModal(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-margin duration-300 ease-in-out`}>
        {/* Header */}
        <div className="h-16 bg-white dark:bg-[#2c2c2e] shadow-sm flex items-center justify-between px-4 border-b dark:border-[#404040]">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} className="text-gray-500" />
            </button>
            
            {currentChat && (
              <div className="ml-4 flex items-center">
                {isEditingTitle ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleUpdateTitle()
                    }}
                    className="flex items-center"
                  >
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Enter chat title"
                      className="px-3 py-2 border dark:border-[#404040] rounded-lg text-sm 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 
                        text-gray-700 dark:text-[#e8e8e8] font-medium font-montserrat
                        bg-white dark:bg-[#404040]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="ml-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-montserrat"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-montserrat"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-[#e8e8e8] font-montserrat">
                      {currentChat.summary}
                    </h2>
                    <button
                      onClick={() => {
                        setNewTitle(currentChat.summary)
                        setIsEditingTitle(true)
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-[#e8e8e8] rounded-full hover:bg-gray-100 dark:hover:bg-[#404040]"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <User size={24} className="text-gray-500" />
              <ChevronDown size={16} className="text-gray-500" />
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

        {/* Chat area */}
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-[#202123]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentChat?.chats.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.role === 'USER'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white dark:bg-[#404040] text-gray-800 dark:text-[#e8e8e8] font-medium'
                  } shadow-sm ${msg.loading ? 'animate-pulse' : ''}`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="p-4 bg-white dark:bg-[#2c2c2e] border-t dark:border-[#404040]">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 border dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 
                  focus:ring-blue-500 text-gray-700 dark:text-[#e8e8e8] font-medium 
                  placeholder:text-gray-400 dark:placeholder:text-[#808080] 
                  bg-white dark:bg-[#404040]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                  hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Delete Chat</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Type "confirm" to delete this chat. This action cannot be undone.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type 'confirm'"
              className="w-full p-2 border dark:border-[#404040] rounded-lg mb-4 
                bg-white dark:bg-[#404040] text-gray-900 dark:text-[#e8e8e8]"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirm('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={deleteConfirm !== 'confirm'}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
