'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  updateCourseAction, 
  getCourseSectionsAction, 
  getCourseFilesAction, 
  createCourseSectionAction, 
  createCourseFileAction,
  deleteCourseSectionAction,
  deleteCourseFileAction
} from '@/lib/actions';
import { getCourseById, Course, CourseSection, CourseFile } from '@/lib/supabase';
import { 
  ChevronLeft, 
  AlertTriangle, 
  Loader2, 
  BookOpen, 
  Palette, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  FileIcon, 
  FolderIcon, 
  ChevronDown, 
  ChevronUp,
  Upload,
  Link2,
  FileUp
} from 'lucide-react';

// Available background colors
const backgroundColors = [
  { value: 'bg-gray-300', label: 'Gray' },
  { value: 'bg-red-200', label: 'Red' },
  { value: 'bg-orange-200', label: 'Orange' },
  { value: 'bg-amber-200', label: 'Amber' },
  { value: 'bg-yellow-200', label: 'Yellow' },
  { value: 'bg-lime-200', label: 'Lime' },
  { value: 'bg-green-200', label: 'Green' },
  { value: 'bg-emerald-200', label: 'Emerald' },
  { value: 'bg-teal-200', label: 'Teal' },
  { value: 'bg-cyan-200', label: 'Cyan' },
  { value: 'bg-sky-200', label: 'Sky' },
  { value: 'bg-blue-200', label: 'Blue' },
  { value: 'bg-indigo-200', label: 'Indigo' },
  { value: 'bg-violet-200', label: 'Violet' },
  { value: 'bg-purple-200', label: 'Purple' },
  { value: 'bg-fuchsia-200', label: 'Fuchsia' },
  { value: 'bg-pink-200', label: 'Pink' },
  { value: 'bg-rose-200', label: 'Rose' },
];

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Use the newer Next.js approach to unwrap params
  const resolvedParams = 'then' in params ? use(params) : params;
  const courseId = resolvedParams.id;

  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    imageUrl: '',
    backgroundColor: 'bg-gray-300',
    active: true,
    instructorName: '',
    instructorTitle: '',
    instructorEmail: '',
    instructorImage: ''
  });
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  
  // Form state for adding new sections and files
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('pdf');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [addingSectionMode, setAddingSectionMode] = useState(false);
  const [addingFileMode, setAddingFileMode] = useState(false);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await getCourseById(courseId);
        if (!data) {
          setError('Course not found');
          return;
        }
        
        setCourse(data);
        setFormValues({
          title: data.title,
          description: data.description || '',
          imageUrl: data.image_url || '',
          backgroundColor: data.background_color,
          active: data.active,
          instructorName: data.instructor_name || '',
          instructorTitle: data.instructor_title || '',
          instructorEmail: data.instructor_email || '',
          instructorImage: data.instructor_image || ''
        });
        
        // Load course sections and files
        await loadCourseSections();
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    if (!isRoleLoading && isAdmin) {
      loadCourse();
    }
  }, [courseId, isRoleLoading, isAdmin]);
  
  const loadCourseSections = async () => {
    try {
      const sectionsData = await getCourseSectionsAction(courseId);
      setSections(sectionsData);
      
      // If sections exist, expand the first one by default
      if (sectionsData.length > 0) {
        setExpandedSections([sectionsData[0].id]);
        setSelectedSectionId(sectionsData[0].id);
        
        // Load files for the first section
        await loadSectionFiles(sectionsData[0].id);
      }
    } catch (err) {
      console.error('Error loading course sections:', err);
    }
  };
  
  const loadSectionFiles = async (sectionId: string) => {
    try {
      const filesData = await getCourseFilesAction(sectionId);
      setFiles(filesData);
    } catch (err) {
      console.error('Error loading section files:', err);
    }
  };
  
  const toggleSection = (sectionId: string) => {
    // Toggle the expanded state
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
    
    // Only load files if this is a different section than currently selected
    if (selectedSectionId !== sectionId) {
      setSelectedSectionId(sectionId);
      // Clear existing files first to avoid showing wrong files momentarily
      setFiles([]);
      // Then load the files for this section
      loadSectionFiles(sectionId);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormValues(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSubmitting(true);
    setError('');

    try {
      console.log('Updating course with ID:', courseId);
      console.log('Form values:', formValues);
      
      const success = await updateCourseAction(
        courseId,
        {
          title: formValues.title,
          description: formValues.description || null,
          image_url: formValues.imageUrl || null,
          background_color: formValues.backgroundColor,
          active: formValues.active,
          instructor_name: formValues.instructorName || null,
          instructor_title: formValues.instructorTitle || null,
          instructor_email: formValues.instructorEmail || null,
          instructor_image: formValues.instructorImage || null
        }
      );

      console.log('Update result:', success);

      if (success) {
        router.push('/admin/courses');
      } else {
        throw new Error('Failed to update course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add a new section to the course
  const handleAddSection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newSectionTitle.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const newSectionId = await createCourseSectionAction(
        courseId,
        newSectionTitle,
        sections.length // Set order index to current section count
      );
      
      if (newSectionId) {
        // Add to local state
        const newSection: CourseSection = {
          id: newSectionId,
          course_id: courseId,
          title: newSectionTitle,
          order_index: sections.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSections(prev => [...prev, newSection]);
        setExpandedSections(prev => [...prev, newSectionId]);
        setSelectedSectionId(newSectionId);
        setNewSectionTitle('');
        setAddingSectionMode(false);
        setFiles([]); // Clear files since new section has no files
      }
    } catch (err) {
      console.error('Error adding section:', err);
      setError('Failed to add section');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Add a new file to a section
  const handleAddFile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!selectedSectionId || !newFileName.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      let fileUrl = newFileUrl;
      let fileType = newFileType;
      let fileSize = ''; // We'll calculate this automatically
      
      // Handle file upload if a file was selected
      if (fileUpload) {
        // In a real implementation, we would upload the file to a storage service
        // and get back a URL. For now, we'll simulate this.
        fileUrl = URL.createObjectURL(fileUpload); // This is temporary and for demo purposes
        fileType = fileUpload.type.split('/')[1] || 'unknown';
        fileSize = formatFileSize(fileUpload.size);
        
        // In production, you would upload the file to your storage service
        // const { url } = await uploadFile(fileUpload);
        // fileUrl = url;
      }
      
      const newFileId = await createCourseFileAction(
        selectedSectionId,
        newFileName,
        fileType,
        fileSize,
        fileUrl || null,
        files.length // Set order index to current file count
      );
      
      if (newFileId) {
        // Add to local state
        const newFile: CourseFile = {
          id: newFileId,
          section_id: selectedSectionId,
          title: newFileName,
          file_type: fileType,
          file_size: fileSize,
          file_url: fileUrl || null,
          order_index: files.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setFiles(prev => [...prev, newFile]);
        setNewFileName('');
        setNewFileType('pdf');
        setNewFileUrl('');
        setFileUpload(null);
        setAddingFileMode(false);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error('Error adding file:', err);
      setError('Failed to add file');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileUpload(file);
      
      // Auto-set file name if empty
      if (!newFileName) {
        setNewFileName(file.name.split('.')[0]);
      }
      
      // Auto-detect file type
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      setNewFileType(extension);
    }
  };

  // Handle section deletion
  const handleDeleteSection = async () => {
    if (!deletingSectionId) return;
    
    try {
      setSubmitting(true);
      
      const success = await deleteCourseSectionAction(deletingSectionId);
      
      if (success) {
        // Remove from local state
        setSections(prev => prev.filter(section => section.id !== deletingSectionId));
        
        // Close any expanded state
        setExpandedSections(prev => prev.filter(id => id !== deletingSectionId));
        
        // Clear selected section if it was the deleted one
        if (selectedSectionId === deletingSectionId) {
          setSelectedSectionId(null);
          setFiles([]);
        }
        
        // Close the confirmation dialog
        setShowDeleteConfirm(false);
        setDeletingSectionId(null);
      } else {
        throw new Error('Failed to delete section');
      }
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Failed to delete section');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Confirm section deletion
  const confirmDeleteSection = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering section toggle
    setDeletingSectionId(sectionId);
    setShowDeleteConfirm(true);
  };
  
  // Cancel section deletion
  const cancelDeleteSection = () => {
    setShowDeleteConfirm(false);
    setDeletingSectionId(null);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setSubmitting(true);
      
      const success = await deleteCourseFileAction(fileId);
      
      if (success) {
        // Remove from local state
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    } finally {
      setSubmitting(false);
    }
  };

  if (isRoleLoading || loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-800/50 rounded-full flex items-center justify-center mb-6 border border-indigo-700/30">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-300" suppressHydrationWarning />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">{isRoleLoading ? 'Checking Access' : 'Loading Course'}</h2>
            <p className="text-indigo-300 text-center">{isRoleLoading ? 'Verifying your admin permissions...' : 'Please wait while we fetch the course details...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center mb-6 border border-amber-800/30">
              <AlertTriangle className="h-10 w-10 text-amber-400" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">Access Restricted</h2>
            <p className="text-indigo-300 text-center mb-6">You need administrator privileges to edit courses.</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 border border-indigo-600/50"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-800/30">
              <AlertTriangle className="h-10 w-10 text-red-400" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">Error</h2>
            <p className="text-indigo-300 text-center mb-6">{error}</p>
            <Link 
              href="/admin/courses" 
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 border border-indigo-600/50"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-indigo-100">Edit Course</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800/30 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-indigo-800/30">
          <div className="border-b border-indigo-800/30 px-6 py-4">
            <h2 className="font-semibold text-indigo-100 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-300" />
              Course Details
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-indigo-300 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Introduction to Programming"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-indigo-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="A brief description of the course..."
              ></textarea>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-indigo-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formValues.imageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-sm text-indigo-400">
                Optional. URL to an image for the course.
              </p>
            </div>

            <div>
              <label htmlFor="backgroundColor" className="block text-sm font-medium text-indigo-300 mb-1">
                Background Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {backgroundColors.map(color => (
                  <div
                    key={color.value}
                    className={`${color.value} w-8 h-8 rounded-md cursor-pointer border-2 ${
                      formValues.backgroundColor === color.value 
                        ? 'border-indigo-400' 
                        : 'border-transparent'
                    }`}
                    onClick={() => setFormValues(prev => ({ ...prev, backgroundColor: color.value }))}
                    title={color.label}
                  ></div>
                ))}
              </div>
              <select
                id="backgroundColor"
                name="backgroundColor"
                value={formValues.backgroundColor}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {backgroundColors.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formValues.active}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 bg-indigo-800/30 border-indigo-700/50 rounded focus:ring-indigo-500"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-indigo-200">
                Active (visible to students)
              </label>
            </div>

            <div className="pt-6 border-t border-indigo-800/30">
              <h3 className="text-lg font-medium text-indigo-100 mb-4">Instructor Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="instructorName" className="block text-sm font-medium text-indigo-300 mb-1">
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    id="instructorName"
                    name="instructorName"
                    value={formValues.instructorName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Dr. John Smith"
                  />
                </div>
                
                <div>
                  <label htmlFor="instructorTitle" className="block text-sm font-medium text-indigo-300 mb-1">
                    Instructor Title
                  </label>
                  <input
                    type="text"
                    id="instructorTitle"
                    name="instructorTitle"
                    value={formValues.instructorTitle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Professor of Electronics"
                  />
                </div>
                
                <div>
                  <label htmlFor="instructorEmail" className="block text-sm font-medium text-indigo-300 mb-1">
                    Instructor Email
                  </label>
                  <input
                    type="email"
                    id="instructorEmail"
                    name="instructorEmail"
                    value={formValues.instructorEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="instructor@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="instructorImage" className="block text-sm font-medium text-indigo-300 mb-1">
                    Instructor Profile Image URL <span className="text-indigo-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="url"
                    id="instructorImage"
                    name="instructorImage"
                    value={formValues.instructorImage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com/profile.jpg"
                  />
                  <p className="mt-1 text-sm text-indigo-400">
                    Provide a URL to the instructor's profile image
                  </p>
                  {formValues.instructorImage && (
                    <div className="mt-2">
                      <p className="text-sm text-indigo-300 mb-1">Preview:</p>
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-indigo-800/50 border border-indigo-700/50">
                        <img 
                          src={formValues.instructorImage} 
                          alt="Instructor preview" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Handle image loading error by showing a placeholder
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/150?text=Error';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-indigo-800/30">
              <h3 className="text-lg font-medium text-indigo-100 mb-4">Course Content</h3>
              
              {/* Sections List */}
              <div className="space-y-4 mb-6">
                {sections.length === 0 ? (
                  <div className="text-center py-10 bg-indigo-800/20 rounded-lg border border-indigo-700/30">
                    <FolderIcon className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                    <p className="text-indigo-300">No sections added yet. Add your first section below.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id} className="border border-indigo-700/50 rounded-md overflow-hidden">
                        {/* Section Header */}
                        <div 
                          className={`flex items-center justify-between p-3 cursor-pointer ${
                            expandedSections.includes(section.id) ? 'bg-indigo-700/40' : 'bg-indigo-800/30'
                          } hover:bg-indigo-700/30`}
                          onClick={() => toggleSection(section.id)}
                        >
                          <div className="flex items-center">
                            <FolderIcon className={`h-5 w-5 mr-2 ${
                              expandedSections.includes(section.id) ? 'text-indigo-300' : 'text-indigo-400'
                            }`} />
                            <span className="font-medium text-indigo-100">{section.title}</span>
                          </div>
                          <div className="flex items-center">
                            <button 
                              type="button"
                              onClick={(e) => confirmDeleteSection(section.id, e)}
                              className="p-1 text-gray-400 hover:text-red-500 mr-2"
                              title="Delete section"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {expandedSections.includes(section.id) ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Section Content (Files) */}
                        {expandedSections.includes(section.id) && (
                          <div className="p-3 bg-[#0f0c24] border-t border-indigo-800/30">
                            {/* Files list */}
                            {files.length === 0 ? (
                              <p className="text-sm text-indigo-300 py-2">No files in this section yet.</p>
                            ) : (
                              <div className="space-y-2 mb-3">
                                {files
                                  .filter(file => file.section_id === section.id)
                                  .map(file => (
                                    <div 
                                      key={file.id} 
                                      className="flex items-center justify-between bg-[#131033] p-2 rounded-md mb-1 border border-indigo-900/40"
                                    >
                                      <div className="flex items-center">
                                        <FileIcon className="h-4 w-4 text-indigo-300 mr-2" />
                                        <div>
                                          <div className="text-sm font-medium text-indigo-100">{file.title}</div>
                                          <div className="text-xs text-indigo-300">
                                            {file.file_type.toUpperCase()} • {file.file_size}
                                            {file.file_url && (
                                              <a 
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer" 
                                                className="ml-2 text-indigo-400 hover:text-indigo-200"
                                              >
                                                View
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-1 text-indigo-400 hover:text-red-400 rounded-full"
                                        title="Delete file"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                            
                            {/* Add file form */}
                            {addingFileMode && selectedSectionId === section.id ? (
                              <div className="bg-[#0c0a1f] p-3 rounded border border-indigo-800/30">
                                <h4 className="text-sm font-medium mb-2 text-indigo-100">Add New File</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label htmlFor="fileName" className="block text-xs font-medium text-indigo-300 mb-1">
                                      File Name *
                                    </label>
                                    <input
                                      type="text"
                                      id="fileName"
                                      value={newFileName}
                                      onChange={(e) => setNewFileName(e.target.value)}
                                      className="w-full px-2 py-1 text-sm bg-indigo-800/30 border border-indigo-700/50 rounded text-indigo-100"
                                      placeholder="e.g., Course Syllabus"
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="fileUpload" className="block text-xs font-medium text-indigo-300 mb-1">
                                      Upload File
                                    </label>
                                    <input
                                      type="file"
                                      id="fileUpload"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                      className="w-full px-2 py-1 text-sm text-indigo-300 bg-indigo-800/30 border border-indigo-700/50 rounded file:bg-indigo-700/50 file:text-indigo-100 file:border-none file:rounded file:px-2 file:py-1 file:mr-2 file:cursor-pointer"
                                    />
                                    {fileUpload && (
                                      <p className="mt-1 text-xs text-green-400">
                                        Ready to upload: {fileUpload.name} ({formatFileSize(fileUpload.size)})
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs text-indigo-400 mb-1">- OR -</p>
                                    <label htmlFor="fileUrl" className="block text-xs font-medium text-indigo-300 mb-1">
                                      External Link URL
                                    </label>
                                    <div className="flex items-center">
                                      <Link2 className="h-4 w-4 text-indigo-400 mr-2" />
                                      <input
                                        type="url"
                                        id="fileUrl"
                                        value={newFileUrl}
                                        onChange={(e) => setNewFileUrl(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm bg-indigo-800/30 border border-indigo-700/50 rounded text-indigo-100"
                                        placeholder="https://example.com/file.pdf"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <label htmlFor="fileType" className="block text-xs font-medium text-indigo-300 mb-1">
                                      File Type *
                                    </label>
                                    <select
                                      id="fileType"
                                      value={newFileType}
                                      onChange={(e) => setNewFileType(e.target.value)}
                                      className="w-full px-2 py-1 text-sm bg-indigo-800/30 border border-indigo-700/50 rounded text-indigo-100"
                                    >
                                      <option value="pdf">PDF</option>
                                      <option value="docx">Word (DOCX)</option>
                                      <option value="pptx">PowerPoint (PPTX)</option>
                                      <option value="xlsx">Excel (XLSX)</option>
                                      <option value="txt">Text (TXT)</option>
                                      <option value="zip">Archive (ZIP)</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>
                                  
                                  <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setAddingFileMode(false)}
                                      className="px-3 py-1 text-xs text-indigo-300 hover:bg-indigo-800/50 rounded border border-indigo-700/30"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleAddFile}
                                      disabled={submitting}
                                      className="px-3 py-1 text-xs bg-indigo-700/50 hover:bg-indigo-600/50 text-white rounded"
                                    >
                                      {submitting ? 'Adding...' : 'Add File'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => {
                                  setSelectedSectionId(section.id);
                                  setAddingFileMode(true);
                                }}
                                className="mt-2 inline-flex items-center text-xs text-indigo-300 hover:text-indigo-100"
                              >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Add File
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Add Section div replaces form */}
              {addingSectionMode ? (
                <div className="bg-[#0c0a1f] p-4 border border-indigo-800/30 rounded-md mb-4">
                  <h4 className="text-sm font-medium mb-2 text-indigo-100">Add New Section</h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="sectionTitle" className="block text-xs font-medium text-indigo-300 mb-1">
                        Section Title *
                      </label>
                      <input
                        type="text"
                        id="sectionTitle"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-100"
                        placeholder="e.g., Introduction"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAddingSectionMode(false)}
                        className="px-3 py-1 text-sm text-indigo-300 hover:bg-indigo-800/50 rounded border border-indigo-700/30"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        disabled={submitting}
                        className="px-3 py-1 bg-indigo-700/50 hover:bg-indigo-600/50 text-white text-sm rounded"
                      >
                        {submitting ? 'Adding...' : 'Add Section'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setAddingSectionMode(true)}
                  className="inline-flex items-center text-sm text-indigo-300 hover:text-indigo-100"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Section
                </button>
              )}
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <Link
                href="/admin/courses"
                className="px-4 py-2 border border-indigo-800/30 rounded-md text-indigo-300 hover:bg-indigo-800/30"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-700/50 hover:bg-indigo-600/50 text-white rounded-md"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0a1f] rounded-lg shadow-xl p-6 max-w-md w-full border border-indigo-800/30">
            <h3 className="text-lg font-medium text-indigo-100 mb-4">Confirm Deletion</h3>
            <p className="text-indigo-300 mb-6">
              Are you sure you want to delete this section and all its files? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDeleteSection}
                className="px-4 py-2 border border-indigo-800/30 rounded-md text-indigo-300 hover:bg-indigo-800/30"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSection}
                className="px-4 py-2 bg-red-900/50 text-white rounded-md hover:bg-red-800/50 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}