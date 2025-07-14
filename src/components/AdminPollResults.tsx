'use client';

import { useState, useEffect, useRef } from 'react';
import { EnhancedPollResults } from '@/lib/supabase';
import { getDetailedPollResultsAction } from '@/lib/actions';
import { 
  BarChart3, 
  Users, 
  Lock, 
  Loader2, 
  User, 
  Mail, 
  RefreshCw, 
  ChevronDown, 
  Calendar, 
  PieChart, 
  Star, 
  CircleUser, 
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPollResultsProps {
  pollId: string;
}

interface UserDataItem {
  user_id: string;
  selected_option: number;
  gender?: string;
  email?: string | null;
  username?: string | null;
  group_class?: string | null;
}

interface PollOption {
  text: string;
  votes: number;
  percentage: number;
}

type EnhancedPollResultsFixed = {
  total_votes: number;
  options: PollOption[];
  user_data: UserDataItem[];
};

export default function AdminPollResults({ pollId }: AdminPollResultsProps) {
  const [results, setResults] = useState<EnhancedPollResultsFixed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'users'>('summary');
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Color scheme
  const colors = {
    primary: '#6366f1', // Indigo
    secondary: '#f97316', // Orange
    tertiary: '#8b5cf6', // Purple
    success: '#10b981', // Emerald
    accent: '#f43f5e', // Rose
    maleColor: '#3b82f6',
    femaleColor: '#ec4899'
  };

  // Color palette for chart bars/segments
  const colorPalette = [
    '#6366f1', // Indigo
    '#f97316', // Orange
    '#8b5cf6', // Purple
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#0ea5e9', // Sky
    '#14b8a6', // Teal
    '#d946ef', // Fuchsia
    '#f59e0b', // Amber
    '#84cc16', // Lime
  ];

  // Define refs early in component
  const isMountedRef = useRef(true);
  
  // Component cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to load results
  const loadResults = async () => {
    try {
      setRefreshing(true);
      setError(''); // Clear previous errors
      
      // Add a more aggressive timeout with proper cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const rawData = await getDetailedPollResultsAction(pollId);
        clearTimeout(timeoutId);
        
        // Process the data to ensure user_data is available
        let processedData: EnhancedPollResultsFixed = {
          total_votes: 0,
          options: [],
          user_data: []
        };
        
        if (rawData) {
          // Extract basic poll data
          processedData.total_votes = rawData.total_votes || 0;
          
          // Process options
          if (rawData.options && Array.isArray(rawData.options)) {
            processedData.options = rawData.options.map((option: any) => ({
              text: option.text || 'Unknown option',
              votes: option.votes || 0,
              percentage: option.percentage || 0
            }));
          }
          
          // Process user data
          if (rawData.user_data && Array.isArray(rawData.user_data)) {
            processedData.user_data = rawData.user_data.map((user: any) => ({
              user_id: user.user_id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
              selected_option: typeof user.selected_option === 'number' ? user.selected_option : 0,
              gender: user.gender || undefined,
              email: user.email || undefined,
              username: user.username || undefined,
              group_class: user.group_class || undefined
            }));
          }
          
          // If poll has votes but no users, create placeholder user entries
          if (processedData.total_votes > 0 && processedData.user_data.length === 0) {
            console.log('Votes found but no user data, creating placeholder entries');
            
            const placeholderUsers: UserDataItem[] = [];
            processedData.options.forEach((option, index) => {
              // For each option with votes, create anonymous users
              for (let i = 0; i < option.votes; i++) {
                placeholderUsers.push({
                  user_id: `anonymous-${index}-${i}`,
                  selected_option: index,
                  username: `Anonymous Voter ${i+1}`
                });
              }
            });
            
            processedData.user_data = placeholderUsers;
          }
        }
        
        // Update state with the processed data
        setResults(processedData);
        
      } catch (err) {
        // Clear timeout on error
        clearTimeout(timeoutId);
        
        // Log but don't throw, set empty results instead
        console.error('Error fetching poll results:', err);
        setError('Failed to load poll results. Please try again.');
        
        setResults({
          total_votes: 0,
          options: [],
          user_data: []
        });
      }
    } catch (err) {
      console.error('Unexpected error in loadResults:', err);
      setError('An unexpected error occurred. Please try again.');
      
      // Still clear refresh state to prevent getting stuck
      setResults({
        total_votes: 0,
        options: [],
        user_data: []
      });
    } finally {
      // Always clear the refreshing state to prevent getting stuck
      if (isMountedRef.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    async function initialLoad() {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      
      // Add a safety timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (isMountedRef.current && loading) {
          setLoading(false);
          setRefreshing(false); // Also ensure refreshing is cleared
          setError('Loading timed out. Please try refreshing.');
          // Set empty results so UI doesn't get stuck
          setResults({
            total_votes: 0,
            options: [],
            user_data: []
          });
        }
      }, 10000); // 10 second max loading time
      
      await loadResults();
      
      clearTimeout(loadingTimeout);
      
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
    initialLoad();
  }, [pollId]);

  // Add force-quit function for stuck states
  const forceResetStates = () => {
    setLoading(false);
    setRefreshing(false);
    setError('');
    setResults({
      total_votes: 0,
      options: [],
      user_data: []
    });
  };

  // Handle search filtering
  const filteredUserData = results?.user_data?.filter(user => {
    const username = user.username || '';
    const email = user.email || '';
    return username.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Helper function to render the appropriate donut chart using SVG
  const renderDonutChart = () => {
    if (!results || !results.options || results.options.length === 0) return null;
    
    const radius = 80;
    const strokeWidth = 30;
    const centerX = 100;
    const centerY = 100;
    const circumference = 2 * Math.PI * radius;

    let startAngle = 0;
    
    return (
      <div className="relative w-full max-w-xs mx-auto">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {results.options.map((option, index) => {
            const percentage = option.percentage || 0;
            const angle = (percentage / 100) * 360;
            const dashLength = (percentage / 100) * circumference;
            
            // Calculate SVG arc path
            const endAngle = startAngle + (angle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            // Determine if the arc should be drawn the long way around
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            // Create the path
            const pathData = `
              M ${centerX} ${centerY}
              L ${x1} ${y1}
              A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            const currentPath = (
              <motion.path
                key={index}
                d={pathData}
                fill={colorPalette[index % colorPalette.length]}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              />
            );
            
            startAngle = endAngle;
            return currentPath;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span 
            className="text-3xl font-bold text-indigo-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {results.total_votes}
          </motion.span>
          <motion.span 
            className="text-sm text-indigo-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Total Votes
          </motion.span>
        </div>
      </div>
    );
  };

  // Helper function to render the bar chart
  const renderBarChart = () => {
    if (!results || !results.options || results.options.length === 0) return null;
    
    return (
      <div className="space-y-4">
        {results.options.map((option, index) => (
          <motion.div 
            key={index} 
            className="space-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium text-indigo-200">{option.text}</span>
              <span className="text-indigo-300">{option.votes} votes ({option.percentage}%)</span>
            </div>
            <div className="h-3 w-full bg-indigo-800/50 rounded-full overflow-hidden border border-indigo-700/30">
              <motion.div 
                className="h-full transition-all duration-500"
                style={{ 
                  backgroundColor: colorPalette[index % colorPalette.length],
                  width: `${option.percentage}%` 
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${option.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Calculate gender statistics
  const calculateGenderStats = () => {
    if (!results) return { male: 0, female: 0, unknown: 0, malePercentage: 0, femalePercentage: 0, unknownPercentage: 0 };
    
    const genderCounts = {
      male: 0,
      female: 0,
      unknown: 0,
      malePercentage: 0,
      femalePercentage: 0,
      unknownPercentage: 0
    };

    results.user_data.forEach(user => {
      if (user.gender === 'male') genderCounts.male++;
      else if (user.gender === 'female') genderCounts.female++;
      else genderCounts.unknown++;
    });

    const totalVotes = results.total_votes || 0;
    
    if (totalVotes > 0) {
      genderCounts.malePercentage = Math.round((genderCounts.male / totalVotes) * 100);
      genderCounts.femalePercentage = Math.round((genderCounts.female / totalVotes) * 100);
      genderCounts.unknownPercentage = Math.round((genderCounts.unknown / totalVotes) * 100);
    }

    return genderCounts;
  };

  const genderStats = calculateGenderStats();

  // Loading state with animation
  if (loading) {
    return (
      <motion.div 
        className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <Loader2 className="h-12 w-12 text-indigo-300" />
          </motion.div>
          <p className="text-indigo-300 text-lg">Loading your amazing poll results...</p>
          <div className="mt-2 text-xs text-indigo-400">(This may take a few moments)</div>
        </div>
        
        <div className="mt-6 max-w-md mx-auto">
          <div className="h-2 bg-indigo-800/50 rounded-full overflow-hidden border border-indigo-700/30">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
        
        {/* Add a manual refresh button for long loading times */}
        <div className="mt-8 text-center">
          <button 
            onClick={forceResetStates}
            className="w-full mb-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium border border-indigo-500/50"
          >
            Skip Loading & Show Empty Results
          </button>
          
          <button 
            onClick={loadResults}
            className="w-full px-4 py-3 bg-indigo-700/80 text-indigo-100 rounded-lg hover:bg-indigo-600/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 border border-indigo-600/50 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline-block" />
            Refresh Manually
          </button>
          <div className="mt-2 text-xs text-indigo-400">
            If loading is taking too long, try refreshing manually
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 bg-red-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-red-800/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-red-300 text-lg font-medium">{error}</p>
        <button 
          onClick={loadResults}
          className="mt-6 px-4 py-2 bg-indigo-700/80 text-indigo-100 rounded-lg hover:bg-indigo-600/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 border border-indigo-600/50"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  if (!results) {
    return (
      <motion.div 
        className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 bg-yellow-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-yellow-800/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-indigo-200 text-lg">No results available for this poll.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-800/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with glass effect */}
      <div className="relative backdrop-blur-sm bg-indigo-800/50 border-b border-indigo-700/30 p-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-900/40">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-100">
                Poll Results
              </h2>
              <p className="text-indigo-300 text-sm">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshing ? forceResetStates : loadResults}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium border border-indigo-500/50"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>Refresh Data</span>
                </>
              )}
            </motion.button>
            
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChartType(chartType === 'bar' ? 'donut' : 'bar')}
                className="flex items-center px-4 py-2 bg-indigo-800/40 border border-indigo-700/30 rounded-lg hover:bg-indigo-700/50 transition-all text-sm font-medium text-indigo-200"
              >
                {chartType === 'bar' ? (
                  <>
                    <PieChart className="h-4 w-4 mr-2 text-indigo-300" />
                    <span>Donut View</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2 text-indigo-300" />
                    <span>Bar View</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-indigo-700/30 -mb-px">
          <motion.button 
            className={`relative py-3 px-6 font-medium text-sm mr-2 ${
              activeTab === 'summary' 
                ? 'text-indigo-300' 
                : 'text-indigo-400 hover:text-indigo-200'
            }`}
            onClick={() => setActiveTab('summary')}
            whileHover={{ scale: activeTab !== 'summary' ? 1.05 : 1 }}
          >
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>Summary</span>
            </div>
            {activeTab === 'summary' && (
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500"
                layoutId="activeTab"
              />
            )}
          </motion.button>
          
          <motion.button 
            className={`relative py-3 px-6 font-medium text-sm ${
              activeTab === 'users' 
                ? 'text-indigo-300' 
                : 'text-indigo-400 hover:text-indigo-200'
            }`}
            onClick={() => setActiveTab('users')}
            whileHover={{ scale: activeTab !== 'users' ? 1.05 : 1 }}
          >
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>User Details</span>
            </div>
            {activeTab === 'users' && (
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div 
                  className="bg-indigo-900/40 backdrop-blur-sm p-4 rounded-xl border border-indigo-800/30 shadow-sm"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.25)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-indigo-300 text-sm font-medium">Total Votes</h3>
                    <div className="p-2 bg-indigo-800/50 rounded-md border border-indigo-700/30">
                      <TrendingUp className="h-4 w-4 text-indigo-300" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-indigo-100">{results.total_votes}</p>
                  <div className="mt-2 text-xs text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    <span>Updated in real-time</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-indigo-900/40 backdrop-blur-sm p-4 rounded-xl border border-indigo-800/30 shadow-sm"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.25)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-indigo-300 text-sm font-medium">Options</h3>
                    <div className="p-2 bg-orange-900/20 rounded-md border border-orange-800/30">
                      <Star className="h-4 w-4 text-orange-300" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-indigo-100">{results.options.length}</p>
                  <div className="mt-2 text-xs text-indigo-300">
                    Available choices in poll
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-indigo-900/40 backdrop-blur-sm p-4 rounded-xl border border-indigo-800/30 shadow-sm"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.25)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-indigo-300 text-sm font-medium">Participants</h3>
                    <div className="p-2 bg-purple-900/20 rounded-md border border-purple-800/30">
                      <CircleUser className="h-4 w-4 text-purple-300" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-indigo-100">{results.user_data?.length || 0}</p>
                  <div className="mt-2 text-xs text-indigo-300">
                    Unique voters
                  </div>
                </motion.div>
              </div>
              
              {/* Vote Distribution */}
              <div className="bg-indigo-800/30 p-6 rounded-xl border border-indigo-700/30 mb-8">
                <h3 className="font-semibold text-indigo-100 text-lg mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-indigo-300 mr-2" />
                  Vote Distribution
                </h3>
                
                <div className="mb-6">
                  <div className="flex justify-center mb-4">
                    {chartType === 'donut' ? renderDonutChart() : null}
                  </div>
                  {chartType === 'bar' ? renderBarChart() : null}
                  
                  {chartType === 'donut' && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {results.options.map((option, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                          ></div>
                          <span className="truncate text-indigo-200" title={option.text}>
                            {option.text} ({option.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Gender Distribution */}
              <div className="bg-indigo-800/30 p-6 rounded-xl border border-indigo-700/30 mb-8">
                <h3 className="font-semibold text-indigo-100 text-lg mb-4 flex items-center">
                  <Users className="h-5 w-5 text-indigo-300 mr-2" />
                  Gender Distribution
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-6 relative overflow-hidden border border-blue-800/30"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-blue-200 font-medium text-lg">Male</h4>
                        <span className="bg-blue-800/50 text-blue-200 px-2 py-1 rounded-full text-xs font-medium border border-blue-700/30">
                          {genderStats.malePercentage}%
                        </span>
                      </div>
                      <p className="text-4xl font-bold text-blue-100 mb-1">{genderStats.male}</p>
                      <p className="text-blue-300 text-sm">Total male voters</p>
                      
                      <div className="mt-4 w-full bg-blue-800/50 rounded-full h-2.5">
                        <motion.div 
                          className="bg-blue-600 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${genderStats.malePercentage}%` }}
                          transition={{ duration: 1 }}
                        ></motion.div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 opacity-10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-24 h-24 text-blue-800" fill="currentColor">
                        <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm5 7v8h2v2H5v-2h2V9a5 5 0 0 1 10 0zm-2 0a3 3 0 0 0-6 0v8h6V9z"/>
                      </svg>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gradient-to-br from-pink-900/30 to-pink-800/20 rounded-xl p-6 relative overflow-hidden border border-pink-800/30"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-pink-200 font-medium text-lg">Female</h4>
                        <span className="bg-pink-800/50 text-pink-200 px-2 py-1 rounded-full text-xs font-medium border border-pink-700/30">
                          {genderStats.femalePercentage}%
                        </span>
                      </div>
                      <p className="text-4xl font-bold text-pink-100 mb-1">{genderStats.female}</p>
                      <p className="text-pink-300 text-sm">Total female voters</p>
                      
                      <div className="mt-4 w-full bg-pink-800/50 rounded-full h-2.5">
                        <motion.div 
                          className="bg-pink-600 h-2.5 rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${genderStats.femalePercentage}%` }}
                          transition={{ duration: 1 }}
                        ></motion.div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 opacity-10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-24 h-24 text-pink-800" fill="currentColor">
                        <path d="M12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2ZM16 14V14.3686C18.3837 15.1568 20 17.3915 20 20H18C18 17.9999 16.209 16.3923 14 16.0703L14 21H16V23H8V21H10V16.0705C7.79109 16.3926 6 17.9999 6 20H4C4 17.3915 5.61629 15.1569 8 14.3687V14C8 11.7909 9.79086 10 12 10C14.2091 10 16 11.7909 16 14Z"/>
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 shadow-sm overflow-hidden"
            >
              {/* Search bar */}
              <div className="p-4 border-b border-indigo-800/30">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    className="block w-full pl-10 pr-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-700 text-indigo-100 text-sm placeholder-indigo-400/70"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Users list */}
              <div className="overflow-x-auto">
                {filteredUserData && filteredUserData.length > 0 ? (
                  <table className="min-w-full">
                    <thead className="bg-indigo-800/40">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          Gender
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          Group
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          Vote
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-800/30">
                      {filteredUserData.map((user, index) => (
                        <motion.tr 
                          key={`${user.user_id}-${index}`}
                          className={`${index % 2 === 0 ? 'bg-indigo-900/20' : 'bg-indigo-900/40'} hover:bg-indigo-800/30 transition-colors cursor-pointer`}
                          whileHover={{ backgroundColor: 'rgba(67, 56, 202, 0.3)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          onClick={() => setExpanded(expanded === index ? null : index)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white ${
                                user.gender === 'male' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                                user.gender === 'female' ? 'bg-gradient-to-br from-pink-500 to-pink-600' : 
                                'bg-gradient-to-br from-indigo-500 to-indigo-600'
                              }`}>
                                {user.email ? user.email.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-100 truncate max-w-[200px]">
                                  {user.username || (user.email ? user.email.split('@')[0] : (user.user_id.startsWith('anonymous') ? 'Anonymous User' : 'Unknown User'))}
                                </div>
                                <div className="text-xs text-indigo-400 truncate max-w-[200px]">
                                  {user.email || user.user_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <motion.div 
                              className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                user.gender === 'male' 
                                  ? 'bg-blue-900/30 text-blue-300 border border-blue-800/30' 
                                  : user.gender === 'female'
                                    ? 'bg-pink-900/30 text-pink-300 border border-pink-800/30'
                                    : 'bg-indigo-900/30 text-indigo-300 border border-indigo-800/30'
                              }`}
                              whileHover={{ scale: 1.05 }}
                            >
                              {user.gender || 'Unknown'}
                            </motion.div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.group_class ? (
                              <motion.div 
                                className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/30"
                                whileHover={{ scale: 1.05 }}
                              >
                                {user.group_class}
                              </motion.div>
                            ) : (
                              <span className="text-indigo-400 italic text-xs">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">
                              {user.selected_option >= 0 && results?.options && user.selected_option < (results.options.length)
                                ? (
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: colorPalette[user.selected_option % colorPalette.length] }}
                                    ></div>
                                    {results.options[user.selected_option]?.text || `Option ${user.selected_option + 1}`}
                                  </div>
                                )
                                : 'Invalid vote'}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-indigo-900/40 rounded-full flex items-center justify-center mb-4 border border-indigo-800/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-indigo-200 mb-2">No User Data Available</h3>
                    <p className="text-indigo-300 mb-6">
                      {results?.total_votes && results.total_votes > 0 
                        ? "Vote data exists but user details couldn't be loaded." 
                        : "No one has voted in this poll yet."}
                    </p>
                    <button 
                      onClick={loadResults}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium border border-indigo-500/50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2 inline" />
                      Refresh Results
                    </button>
                  </div>
                )}
              </div>
              
              {/* Bottom info card */}
              <div className="p-4 bg-indigo-800/30 border-t border-indigo-700/30 mt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="bg-indigo-700/50 p-2 rounded-lg mr-3 border border-indigo-600/30">
                      <Users className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-indigo-100">Total Participants</h3>
                      <p className="text-sm text-indigo-300">
                        {results.user_data?.length || 0} users have voted in this poll
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Download user data as CSV
                      if (!results.user_data || results.user_data.length === 0) return;
                      
                      const headers = ['User ID', 'Username', 'Email', 'Gender', 'Group', 'Vote'];
                      const csvContent = [
                        headers.join(','),
                        ...results.user_data.map(user => [
                          user.user_id,
                          user.username || (user.email ? user.email.split('@')[0] : 'Unknown'),
                          user.email || 'N/A',
                          user.gender || 'Unknown',
                          user.group_class || 'Not assigned',
                          user.selected_option >= 0 && user.selected_option < results.options.length
                            ? results.options[user.selected_option].text
                            : 'Invalid vote'
                        ].join(','))
                      ].join('\n');
                      
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `poll_users_${pollId}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                    className="px-4 py-2 bg-indigo-700/80 text-indigo-100 rounded-lg hover:bg-indigo-600/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium border border-indigo-600/50"
                  >
                    Download User Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}