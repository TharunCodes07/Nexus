'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, Plus, Trash2, ChevronDown, LogOut, User, Pencil, Settings, Sun, Moon, FileText, Video, File, Upload, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

interface FileData {
  type: 'text' | 'pdf' | 'video'
  name: string
  content: string
  originalName: string
}

const LoadingDots = () => (
  <span className="loading-dots">
    <span className="dot">.</span>
    <span className="dot">.</span>
    <span className="dot">.</span>
  </span>
);

export default function ChatPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
  const [showFileModal, setShowFileModal] = useState(false)
  const [fileType, setFileType] = useState<'text' | 'pdf' | 'video' | null>(null)
  const [textContent, setTextContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([])
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const MAX_FILES = 10;

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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const chatId = searchParams.get('id');
    
    if (chatId) {
      const selectedChat = chats.find(chat => chat.id === parseInt(chatId));
      if (selectedChat) {
        setCurrentChat(selectedChat);
      }
    }
  }, [chats]);

  useEffect(() => {
    if (currentChat) {
      fetchFiles()
    }
  }, [currentChat])

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
      let chatToUse: Chat | null = currentChat;
      
      
      if (!chatToUse) {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `Chat ${new Date().toLocaleString()}`
          })
        })
        if (!res.ok) throw new Error('Failed to create chat')
        const newChat: Chat = await res.json()
        chatToUse = newChat
        setCurrentChat(newChat)

        if (chats.length === 0) {
          setChats([newChat])
        } else {
          setChats(prevChats => [...prevChats, newChat])
        }
      }

      const userMessage = { role: 'USER' as const, message }
      const loadingMessage = { role: 'BOT' as const, message: 'loadingDots', loading: true }
      
      setCurrentChat(prev => prev ? {
        ...prev,
        chats: [...prev.chats, userMessage, loadingMessage]
      } : null)
      
      setMessage('')

      // Send to API
      const res = await fetch(`/api/chats/${chatToUse.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      if (!res.ok) throw new Error('Failed to send message')
      const updatedChat = await res.json()
      setCurrentChat(updatedChat)
      
      setChats(prevChats => prevChats.map(chat => 
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

  const handleFileUpload = async () => {
    if (uploadedFiles.length >= MAX_FILES) {
      alert('Maximum 10 files allowed')
      return
    }

    if (!currentChat) {
      alert('Please create a chat first')
      return
    }

    try {
      if (fileType === 'text' && textContent) {
        
        const fileName = textContent.split(' ').slice(0, 3).join('_') + '.txt'
        const res = await fetch('/api/files/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentChat.id,
            content: textContent,
            fileName,
            type: 'text'
          })
        })
        if (!res.ok) throw new Error('Failed to save text')
      } else if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('chatId', currentChat.id.toString())

        if (fileType === 'pdf') {
          
          const pdfRes = await fetch('api/file2text/', {
            method: 'POST',
            body: formData
          })
          if (!pdfRes.ok) throw new Error('Failed to convert PDF')
          const { text } = await pdfRes.json()

          
          await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: currentChat.id,
              content: text,
              fileName: `${selectedFile.name}_extracted.txt`,
              type: 'pdf'
            })
          })
        } else if (fileType === 'video') {
          
          const videoRes = await fetch('api/video2text/', {
            method: 'POST',
            body: formData
          })
          if (!videoRes.ok) throw new Error('Failed to convert video')
          const { text } = await videoRes.json()

          // Save extracted text
          await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: currentChat.id,
              content: text,
              fileName: `${selectedFile.name}_extracted.txt`,
              type: 'video'
            })
          })
        }
      }

      // Refresh files list
      fetchFiles()
      setShowFileModal(false)
      setFileType(null)
      setTextContent('')
      setSelectedFile(null)
    } catch (error) {
      console.error('Error handling file:', error)
      alert('Failed to process file')
    }
  }

  const fetchFiles = async () => {
    if (!currentChat) return
    try {
      const res = await fetch(`/api/files/${currentChat.id}`)
      if (!res.ok) throw new Error('Failed to fetch files')
      const data = await res.json()
      setUploadedFiles(data.files)
    } catch (error) {
      console.error('Error fetching files:', error)
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
            {uploadedFiles.map((file) => (
              <div key={file.name} className="space-y-2">
                <div
                  className="flex items-center justify-between p-3 rounded-lg 
                    bg-gray-50 dark:bg-[#404040] cursor-pointer"
                  onClick={() => setExpandedFile(expandedFile === file.name ? null : file.name)}
                >
                  <div className="flex items-center space-x-3">
                    {file.type === 'text' && <FileText size={18} className="text-blue-500" />}
                    {file.type === 'pdf' && <File size={18} className="text-red-500" />}
                    {file.type === 'video' && <Video size={18} className="text-purple-500" />}
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-[#d1d1d1] font-medium">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {file.type}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transform transition-transform duration-200 
                      ${expandedFile === file.name ? 'rotate-180' : ''}`}
                  />
                </div>
                {expandedFile === file.name && (
                  <div className="p-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 
                    dark:bg-[#404040] rounded-lg ml-6 prose dark:prose-invert max-w-none">
                    {file.type === 'pdf' ? (
                      <ReactMarkdown>
                        {file.content}
                      </ReactMarkdown>
                    ) : (
                      file.content
                    )}
                  </div>
                )}
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
                      : 'bg-white dark:bg-[#404040] text-gray-800 dark:text-[#e8e8e8] font-medium border border-gray-200 dark:border-transparent'
                  }`}
                >
                  {msg.loading && msg.message === 'loadingDots' ? (
                    <LoadingDots />
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="p-4 bg-white dark:bg-[#2c2c2e] border-t dark:border-[#404040]">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowFileModal(true)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                  dark:hover:bg-[#404040] rounded-lg flex items-center"
                disabled={uploadedFiles.length >= MAX_FILES}
              >
                <Upload size={18} className="mr-2" />
                <span>Add Files ({uploadedFiles.length}/{MAX_FILES})</span>
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!loading && message.trim()) {
                      handleSendMessage(e)
                    }
                  }
                }}
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
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirm !== 'confirm'}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </form>
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

      {/* File Upload Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-[#e8e8e8] font-montserrat">
                  Add Files
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {uploadedFiles.length} of {MAX_FILES} files used
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFileModal(false)
                  setFileType(null)
                  setTextContent('')
                  setSelectedFile(null)
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {uploadedFiles.length >= MAX_FILES ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You've reached the maximum limit of {MAX_FILES} files.
                  Please delete some files before adding more.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File type selection */}
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setFileType('text')}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center border 
                      ${fileType === 'text' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <FileText size={24} className={fileType === 'text' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className="mt-2 text-sm font-medium">Text</span>
                  </button>
                  <button
                    onClick={() => setFileType('pdf')}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center border 
                      ${fileType === 'pdf' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <File size={24} className={fileType === 'pdf' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className="mt-2 text-sm font-medium">PDF</span>
                  </button>
                  <button
                    onClick={() => setFileType('video')}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center border 
                      ${fileType === 'video' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <Video size={24} className={fileType === 'video' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className="mt-2 text-sm font-medium">Video</span>
                  </button>
                </div>

                {/* Input area based on selected type */}
                {fileType === 'text' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter your text
                    </label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="w-full h-32 p-3 border dark:border-gray-700 rounded-lg 
                        bg-white dark:bg-[#404040] text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      placeholder="Type or paste your text here..."
                    />
                  </div>
                ) : fileType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload {fileType.toUpperCase()} file
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed 
                      border-gray-300 dark:border-gray-700 rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload size={24} className="mx-auto text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-blue-600 
                              dark:text-blue-400 hover:text-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              type="file"
                              className="sr-only"
                              accept={fileType === 'pdf' ? '.pdf' : 'video/*'}
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedFile ? selectedFile.name : `${fileType.toUpperCase()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowFileModal(false)
                      setFileType(null)
                      setTextContent('')
                      setSelectedFile(null)
                    }}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                      hover:bg-gray-100 dark:hover:bg-[#404040] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={!fileType || (fileType === 'text' ? !textContent : !selectedFile)}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg 
                      hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
