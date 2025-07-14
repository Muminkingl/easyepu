'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createAnnouncementAction, createPollAction } from '@/lib/actions';
import { 
  AlertCircle, 
  CheckCircle, 
  ChevronLeft, 
  X, 
  Bell, 
  Loader2,
  Info,
  BarChart,
  Plus,
  Trash,
  Calendar,
  Users,
  AlertTriangle,
  Target,
  MessageSquare,
  Flag
} from 'lucide-react';
import Link from 'next/link';
import DOMPurify from 'dompurify';

export default function NewAnnouncement() {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Poll related states
  const [includePoll, setIncludePoll] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollEndDate, setPollEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!content.trim()) {
        throw new Error('Content is required');
      }
      
      // Validate poll inputs if poll is included
      if (includePoll) {
        if (!pollTitle.trim()) {
          throw new Error('Poll title is required');
        }
        
        const validOptions = pollOptions.filter(option => option.trim() !== '');
        if (validOptions.length < 2) {
          throw new Error('At least two poll options are required');
        }
      }
      
      // Sanitize inputs to prevent XSS
      const sanitizedTitle = DOMPurify.sanitize(title.trim());
      const sanitizedContent = DOMPurify.sanitize(content.trim());
      
      // Create announcement
      const announcementId = await createAnnouncementAction(
        user.id,
        sanitizedTitle,
        sanitizedContent,
        true,
        isImportant,
        targetAudience
      );
      
      if (!announcementId) {
        throw new Error('Failed to create announcement');
      }
      
      // Create poll if included
      if (includePoll) {
        const validOptions = pollOptions
          .filter(option => option.trim() !== '')
          .map(option => DOMPurify.sanitize(option.trim()));
        
        const sanitizedPollTitle = DOMPurify.sanitize(pollTitle.trim());
        const sanitizedPollDescription = pollDescription.trim() 
          ? DOMPurify.sanitize(pollDescription.trim()) 
          : null;
        
        const pollId = await createPollAction(
          announcementId,
          sanitizedPollTitle,
          validOptions,
          sanitizedPollDescription,
          true,
          pollEndDate ? new Date(pollEndDate).toISOString() : null
        );
        
        if (!pollId) {
          console.error('Warning: Announcement created but poll creation failed');
        }
      }
      
      setSuccess(true);
      
      // Reset form
      setTitle('');
      setContent('');
      setTargetAudience('all');
      setIsImportant(false);
      setIncludePoll(false);
      setPollTitle('');
      setPollDescription('');
      setPollOptions(['', '']);
      setPollEndDate('');
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => {
    setError('');
  };
  
  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };
  
  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };
  
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const updatedOptions = [...pollOptions];
    updatedOptions[index] = value;
    setPollOptions(updatedOptions);
    
    // If we're editing the last option and it's not empty, add a new empty option
    if (index === pollOptions.length - 1 && value.trim() !== '') {
      setPollOptions([...updatedOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    // Keep at least 2 options
    if (pollOptions.length <= 2) return;
    
    const filteredOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(filteredOptions);
  };

  const minimumDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-indigo-950">
      {/* Main container with responsive padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            href="/admin/announcements"
            className="group inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-all duration-200"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-900/40 border border-indigo-800/30 backdrop-blur-sm shadow-sm group-hover:shadow-md group-hover:-translate-x-0.5 transition-all duration-200">
              <ChevronLeft className="h-5 w-5" />
            </div>
            <span className="ml-2 text-sm">Back to Announcements</span>
          </Link>
        </div>
        
        {/* Main content grid - 2 columns on medium screens and up */}
        <div className="grid md:grid-cols-6 gap-8">
          {/* Left sidebar with info */}
          <div className="md:col-span-2">
            <div className="sticky top-8 bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-800/30">
              <div className="bg-gradient-to-br from-indigo-800 to-blue-900 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-indigo-800/60 backdrop-blur-sm rounded-xl border border-indigo-700/50">
                    <Bell className="h-6 w-6 text-indigo-200" />
                  </div>
                  <h2 className="ml-3 text-indigo-100 font-bold text-xl">Announcement</h2>
                </div>
                <p className="text-indigo-300 text-sm mb-2">
                  Create announcements to inform your audience about important updates, events, or news.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-indigo-200 font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
                    Important Announcements
                  </h3>
                  <p className="text-indigo-300 text-sm pl-6">
                    Mark critical updates as "Important" to highlight them on the dashboard.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-indigo-200 font-medium flex items-center">
                    <Target className="h-4 w-4 mr-2 text-indigo-300" />
                    Target Audience
                  </h3>
                  <p className="text-indigo-300 text-sm pl-6">
                    Choose who can see your announcement: all users, students only, or faculty only.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-indigo-200 font-medium flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-indigo-300" />
                    Polls
                  </h3>
                  <p className="text-indigo-300 text-sm pl-6">
                    Add polls to gather feedback or opinions from your audience.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-4">
            <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-800/30">
              <div className="p-6 sm:p-8">
                <h1 className="text-2xl font-bold text-indigo-100 mb-6">Create New Announcement</h1>
                
            {error && (
                  <div className="mb-6 bg-red-900/20 backdrop-blur-sm border border-red-800/30 p-4 rounded-xl flex items-start">
                    <AlertCircle className="text-red-400 mt-0.5 mr-3 flex-shrink-0 h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-300">{error}</p>
                    </div>
                    <button onClick={closeError} className="text-red-400 hover:text-red-300 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                {success && (
                  <div className="mb-6 bg-green-900/20 backdrop-blur-sm border border-green-800/30 p-4 rounded-xl flex items-start">
                    <CheckCircle className="text-green-400 mt-0.5 mr-3 flex-shrink-0 h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-300">Announcement created successfully!</p>
                      <p className="mt-1 text-green-400 text-sm">Redirecting to dashboard...</p>
                    </div>
              </div>
            )}
            
                <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Title field */}
              <div>
                      <label htmlFor="title" className="block text-sm font-medium text-indigo-200 mb-1">
                        Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter announcement title"
                  required
                />
              </div>
              
                  {/* Content field */}
              <div>
                      <label htmlFor="content" className="block text-sm font-medium text-indigo-200 mb-1">
                        Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 h-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter announcement content"
                  required
                      ></textarea>
              </div>
              
                    {/* Target audience */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-1">
                    Target Audience
                  </label>
                      <div className="grid grid-cols-3 gap-4">
                        <label className="flex items-center bg-indigo-800/30 border border-indigo-700/50 rounded-lg px-4 py-3 cursor-pointer">
                          <input
                            type="radio"
                            name="target"
                            checked={targetAudience === 'all'}
                            onChange={() => setTargetAudience('all')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <Users className="h-4 w-4 ml-2 mr-1 text-indigo-300" />
                          <span className="ml-2 text-indigo-200">Everyone</span>
                        </label>
                        <label className="flex items-center bg-indigo-800/30 border border-indigo-700/50 rounded-lg px-4 py-3 cursor-pointer">
                          <input
                            type="radio"
                            name="target"
                            checked={targetAudience === 'students'}
                            onChange={() => setTargetAudience('students')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <MessageSquare className="h-4 w-4 ml-2 mr-1 text-indigo-300" />
                          <span className="ml-2 text-indigo-200">Students</span>
                        </label>
                        <label className="flex items-center bg-indigo-800/30 border border-indigo-700/50 rounded-lg px-4 py-3 cursor-pointer">
                          <input
                            type="radio"
                            name="target"
                            checked={targetAudience === 'faculty'}
                            onChange={() => setTargetAudience('faculty')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <Flag className="h-4 w-4 ml-2 mr-1 text-indigo-300" />
                          <span className="ml-2 text-indigo-200">Faculty</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Important checkbox */}
                    <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="important"
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-indigo-700/50 rounded"
                      />
                      <label
                        htmlFor="important"
                        className="ml-2 flex items-center text-indigo-200"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-400 mr-1" />
                        Mark as important
                    </label>
                      <div className="ml-2 group relative">
                        <Info className="h-4 w-4 text-indigo-400 cursor-help" />
                        <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-52 p-2 bg-indigo-800 text-indigo-200 text-xs rounded shadow-lg z-10">
                          Important announcements are highlighted and stay at the top of the student dashboard.
                          <div className="absolute left-0 top-full h-2 w-2 -mt-1 ml-1 bg-indigo-800 transform rotate-45"></div>
                </div>
              </div>
                    </div>
                    
                    {/* Include poll checkbox */}
                    <div>
                      <div className="flex items-center">
                      <input
                        type="checkbox"
                          id="include-poll"
                        checked={includePoll}
                        onChange={(e) => setIncludePoll(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-indigo-700/50 rounded"
                        />
                        <label
                          htmlFor="include-poll"
                          className="ml-2 flex items-center text-indigo-200"
                        >
                          <BarChart className="h-4 w-4 text-indigo-300 mr-1" />
                          Include a poll
                    </label>
                  </div>
                  
                  {includePoll && (
                        <div className="mt-4 space-y-4 p-4 bg-indigo-800/20 rounded-lg border border-indigo-700/30">
                      <div>
                            <label htmlFor="poll-title" className="block text-sm font-medium text-indigo-200 mb-1">
                              Poll Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                              id="poll-title"
                          value={pollTitle}
                          onChange={(e) => setPollTitle(e.target.value)}
                              className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Enter poll title"
                        />
                      </div>
                      
                      <div>
                            <label htmlFor="poll-description" className="block text-sm font-medium text-indigo-200 mb-1">
                          Poll Description (Optional)
                        </label>
                            <input
                              type="text"
                              id="poll-description"
                          value={pollDescription}
                          onChange={(e) => setPollDescription(e.target.value)}
                              className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Enter poll description"
                        />
                      </div>
                      
                      <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-2">
                              Poll Options <span className="text-red-400">*</span> (Minimum 2)
                        </label>
                            
                            <div className="space-y-2">
                          {pollOptions.map((option, index) => (
                                <div key={index} className="flex items-center">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                    className="flex-1 bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={`Option ${index + 1}`}
                              />
                                  {pollOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(index)}
                                      className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                                >
                                      <Trash className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <button
                          type="button"
                          onClick={addPollOption}
                              className="mt-3 flex items-center text-indigo-300 hover:text-indigo-200 font-medium transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                              Add option
                        </button>
                      </div>
                      
                      <div>
                            <label htmlFor="poll-end-date" className="block text-sm font-medium text-indigo-200 mb-1">
                              End Date (Optional)
                        </label>
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 text-indigo-400 mr-2" />
                        <input
                          type="date"
                                id="poll-end-date"
                          value={pollEndDate}
                                min={minimumDate()}
                          onChange={(e) => setPollEndDate(e.target.value)}
                                className="flex-1 bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                            </div>
                            <p className="mt-1 text-xs text-indigo-400">
                              If no end date is set, the poll will remain active until manually closed.
                        </p>
                      </div>
                    </div>
                  )}
                    </div>
                  
                    {/* Submit button */}
                    <div className="pt-4">
                <button
                        type="submit"
                  disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                          <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                            Creating...
                          </>
                  ) : (
                          <>
                            <Bell className="h-5 w-5 mr-2" />
                            Create Announcement
                          </>
                  )}
                </button>
              </div>
                </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 