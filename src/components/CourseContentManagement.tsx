import React from 'react';
import { 
  FolderIcon, 
  FileIcon, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  PlusCircle,
  Link2,
  Upload,
  Eye,
  Download,
  YoutubeIcon
} from 'lucide-react';
import { CourseSection, CourseFile } from '@/lib/supabase';

interface CourseContentManagementProps {
  sections: CourseSection[];
  files: CourseFile[];
  expandedSections: string[];
  selectedSectionId: string | null;
  submitting: boolean;
  addingSectionMode: boolean;
  addingFileMode: boolean;
  newSectionTitle: string;
  newFileName: string;
  newFileType: string;
  newFileUrl: string;
  fileUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  
  // Methods
  toggleSection: (sectionId: string) => void;
  confirmDeleteSection: (sectionId: string, e: React.MouseEvent) => void;
  confirmDeleteFile: (fileId: string) => void;
  handleDeleteFile: (fileId: string) => void;
  setAddingSectionMode: (mode: boolean) => void;
  setAddingFileMode: (mode: boolean) => void;
  setNewSectionTitle: (title: string) => void;
  setNewFileName: (name: string) => void;
  setNewFileType: (type: string) => void;
  setNewFileUrl: (url: string) => void;
  handleAddSection: (e?: React.FormEvent) => void;
  handleAddFile: (e?: React.FormEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatFileSize: (bytes: number) => string;
  setSelectedSectionId: (id: string | null) => void;
}

export const CourseContentManagement: React.FC<CourseContentManagementProps> = ({
  sections,
  files,
  expandedSections,
  selectedSectionId,
  submitting,
  addingSectionMode,
  addingFileMode,
  newSectionTitle,
  newFileName,
  newFileType,
  newFileUrl,
  fileUpload,
  fileInputRef,
  toggleSection,
  confirmDeleteSection,
  confirmDeleteFile,
  handleDeleteFile,
  setAddingSectionMode,
  setAddingFileMode,
  setNewSectionTitle,
  setNewFileName,
  setNewFileType,
  setNewFileUrl,
  handleAddSection,
  handleAddFile,
  handleFileChange,
  formatFileSize,
  setSelectedSectionId
}) => {
  // Function to detect if a URL is from YouTube
  const isYoutubeLink = (url: string | null): boolean => {
    if (!url) return false;
    
    // Check for various YouTube URL formats
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('youtube-nocookie.com');
  };

  // Function to get the appropriate file icon
  const getFileIcon = (file: CourseFile) => {
    if (isYoutubeLink(file.file_url)) {
      return <YoutubeIcon className="h-4 w-4 text-red-400" />;
    }
    
    if (file.file_url?.includes('drive.google.com')) {
      return <Link2 className="h-4 w-4 text-white" />;
    }
    
    return <FileIcon className="h-4 w-4 text-white" />;
  };

  return (
    <div className="relative pt-8">
      {/* Elegant Header with Gradient Line */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent h-px top-0"></div>
        <div className="relative bg-transparent pt-6">
          <h3 className="text-2xl font-light text-indigo-100 tracking-wide mb-2">
            Course Content
          </h3>
          <p className="text-sm text-indigo-300 font-light">
            Organize and manage your educational materials
          </p>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="space-y-6">
        {sections.length === 0 ? (
          /* Empty State - Sophisticated Design */
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-indigo-950/80 opacity-60"></div>
            <div className="relative text-center py-16 px-8 border border-indigo-800/60 rounded-2xl bg-indigo-900/40 backdrop-blur-sm shadow-xl shadow-indigo-950/30">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/50 to-indigo-700/50 rounded-2xl rotate-6 transform"></div>
                <div className="relative bg-indigo-900/80 rounded-2xl p-4 shadow-lg">
                  <FolderIcon className="h-8 w-8 text-indigo-300" />
                </div>
              </div>
              <h4 className="text-xl font-light text-indigo-200 mb-2">No sections created yet</h4>
              <p className="text-indigo-300 font-light">Start building your course by adding your first section</p>
            </div>
          </div>
        ) : (
          /* Sections List - Premium Design */
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="group relative">
                {/* Subtle Background Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-800/20 via-indigo-700/20 to-indigo-800/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
                
                <div className="relative bg-indigo-900/40 border border-indigo-800/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Section Header - Luxurious Design */}
                  <div 
                    className={`relative flex items-center justify-between p-6 cursor-pointer transition-all duration-300 ${
                      expandedSections.includes(section.id) 
                        ? 'bg-gradient-to-r from-indigo-800/60 to-indigo-900/60' 
                        : 'bg-indigo-900/40 hover:bg-gradient-to-r hover:from-indigo-800/40 hover:to-indigo-900/40'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    {/* Left Side */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          expandedSections.includes(section.id)
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg'
                            : 'bg-gradient-to-br from-indigo-700/50 to-indigo-800/50 group-hover:from-indigo-600/50 group-hover:to-indigo-700/50'
                        }`}>
                          <FolderIcon className={`h-5 w-5 transition-colors duration-300 ${
                            expandedSections.includes(section.id) ? 'text-white' : 'text-indigo-300'
                          }`} />
                        </div>
                        {/* Section Number Badge */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-lg">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-indigo-100 tracking-wide">{section.title}</h4>
                        <p className="text-sm text-indigo-300 font-light">
                          {files.filter(file => file.section_id === section.id).length} files
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Side */}
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button"
                        onClick={(e) => confirmDeleteSection(section.id, e)}
                        className="group/btn relative p-2 rounded-xl bg-gradient-to-br from-red-900/40 to-red-800/40 hover:from-red-800/50 hover:to-red-700/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        title="Delete section"
                      >
                        <Trash2 className="h-4 w-4 text-red-400 group-hover/btn:text-red-300 transition-colors" />
                      </button>
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        expandedSections.includes(section.id)
                          ? 'bg-gradient-to-br from-indigo-700/60 to-indigo-600/60'
                          : 'bg-gradient-to-br from-indigo-800/40 to-indigo-700/40'
                      }`}>
                        {expandedSections.includes(section.id) ? (
                          <ChevronUp className="h-5 w-5 text-indigo-300" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-indigo-300" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Section Content - Files */}
                  {expandedSections.includes(section.id) && (
                    <div className="relative border-t border-indigo-800/30">
                      {/* Subtle Inner Glow */}
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-800/10 to-transparent pointer-events-none"></div>
                      
                      <div className="relative p-6">
                        {files.filter(file => file.section_id === section.id).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-800/50 to-indigo-700/50 rounded-2xl flex items-center justify-center">
                              <FileIcon className="h-6 w-6 text-indigo-300" />
                            </div>
                            <p className="text-indigo-300 font-light">No files in this section yet</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 mb-6">
                            {files
                              .filter(file => file.section_id === section.id)
                              .map(file => (
                                <div 
                                  key={file.id} 
                                  className="group/file relative p-4 bg-gradient-to-r from-indigo-900/60 to-indigo-800/60 border border-indigo-700/40 rounded-xl hover:shadow-md transition-all duration-300"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className={`w-10 h-10 ${isYoutubeLink(file.file_url) ? 'bg-gradient-to-br from-red-700/80 to-red-600/80' : 'bg-gradient-to-br from-indigo-600/80 to-indigo-500/80'} rounded-lg flex items-center justify-center shadow-md`}>
                                        {getFileIcon(file)}
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-indigo-100">{file.title}</h5>
                                        <div className="flex items-center space-x-3 mt-1">
                                          <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
                                            {isYoutubeLink(file.file_url) ? 'YouTube' : file.file_type}
                                          </span>
                                          <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
                                          <span className="text-xs text-indigo-300">{file.file_size}</span>
                                          {file.file_url && (
                                            <>
                                              <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
                                              <a 
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center space-x-1 text-xs text-indigo-300 hover:text-indigo-100 transition-colors"
                                              >
                                                <Eye className="h-3 w-3" />
                                                <span>View</span>
                                              </a>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => confirmDeleteFile(file.id)}
                                      className="p-2 rounded-lg bg-gradient-to-br from-red-900/40 to-red-800/40 hover:from-red-800/50 hover:to-red-700/50 transition-all duration-300 opacity-0 group-hover/file:opacity-100"
                                      title="Delete file"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        
                        {/* Add File Form - Elegant Design */}
                        {addingFileMode && selectedSectionId === section.id ? (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/50 to-indigo-900/50 rounded-2xl"></div>
                            <div className="relative p-6 border border-indigo-700/60 rounded-2xl bg-indigo-900/40 backdrop-blur-sm">
                              <div className="flex items-center space-x-3 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center">
                                  <Upload className="h-4 w-4 text-white" />
                                </div>
                                <h4 className="text-lg font-medium text-indigo-100">Add New File</h4>
                              </div>
                              
                              <div className="space-y-6">
                                <div>
                                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                                    File Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    className="w-full px-4 py-3 bg-indigo-800/30 border border-indigo-700/50 rounded-xl text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                                    placeholder="e.g., Course Syllabus"
                                    required
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                                    Upload File
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="file"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex items-center justify-center p-6 bg-gradient-to-br from-indigo-800/50 to-indigo-900/50 border-2 border-dashed border-indigo-700/50 rounded-xl hover:border-indigo-600/50 transition-colors">
                                      <div className="text-center">
                                        <Upload className="h-8 w-8 text-indigo-300 mx-auto mb-2" />
                                        <p className="text-sm text-indigo-200">
                                          Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-indigo-300 mt-1">
                                          PDF, DOC, PPT, XLS and more
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {fileUpload && (
                                    <div className="mt-3 p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/30 rounded-lg">
                                      <p className="text-sm text-green-400 flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span>Ready to upload: {fileUpload.name} ({formatFileSize(fileUpload.size)})</span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="relative">
                                  <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-indigo-700/30"></div>
                                  </div>
                                  <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-indigo-900 text-indigo-300 font-light">or</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                                    External Link URL
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className="absolute left-3 flex items-center h-full">
                                      {isYoutubeLink(newFileUrl) ? (
                                        <YoutubeIcon className="h-5 w-5 text-red-500" />
                                      ) : (
                                        <Link2 className="h-5 w-5 text-indigo-300" />
                                      )}
                                    </div>
                                    <input
                                      type="url"
                                      value={newFileUrl}
                                      onChange={(e) => {
                                        setNewFileUrl(e.target.value);
                                        // Auto-detect YouTube links and set file type
                                        if (isYoutubeLink(e.target.value) && newFileType !== 'video') {
                                          setNewFileType('video');
                                        }
                                      }}
                                      className={`w-full pl-10 pr-4 py-3 bg-indigo-800/30 border ${isYoutubeLink(newFileUrl) ? 'border-indigo-600/70' : 'border-indigo-700/50'} rounded-xl text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300`}
                                      placeholder="https://example.com/file.pdf"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                                    File Type *
                                  </label>
                                  <select
                                    value={newFileType}
                                    onChange={(e) => setNewFileType(e.target.value)}
                                    className="w-full px-4 py-3 bg-indigo-800/30 border border-indigo-700/50 rounded-xl text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                                  >
                                    <option value="pdf">PDF Document</option>
                                    <option value="docx">Word Document</option>
                                    <option value="pptx">PowerPoint Presentation</option>
                                    <option value="xlsx">Excel Spreadsheet</option>
                                    <option value="txt">Text File</option>
                                    <option value="video">Video</option>
                                    <option value="zip">Archive File</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                  <button
                                    type="button"
                                    onClick={() => setAddingFileMode(false)}
                                    className="px-6 py-2 text-indigo-200 bg-indigo-800/50 border border-indigo-700/50 rounded-xl hover:bg-indigo-700/50 transition-all duration-300 font-medium"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleAddFile}
                                    disabled={submitting}
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl transition-all duration-300 font-medium shadow-lg disabled:opacity-50"
                                  >
                                    {submitting ? 'Adding...' : 'Add File'}
                                  </button>
                                </div>
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
                            className="group/add flex items-center justify-center w-full p-4 bg-gradient-to-r from-indigo-900/60 to-indigo-800/60 border-2 border-dashed border-indigo-700/50 rounded-xl hover:border-indigo-600/50 hover:from-indigo-800/60 hover:to-indigo-700/60 transition-all duration-300"
                          >
                            <PlusCircle className="h-5 w-5 text-indigo-300 group-hover/add:text-indigo-200 mr-2 transition-colors" />
                            <span className="text-indigo-300 font-medium group-hover/add:text-indigo-200 transition-colors">
                              Add File to Section
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Section Form - Premium Design */}
        {addingSectionMode ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/50 to-indigo-900/50 rounded-2xl"></div>
            <div className="relative p-8 border border-indigo-700/60 rounded-2xl bg-indigo-900/40 backdrop-blur-sm shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FolderIcon className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-xl font-medium text-indigo-100">Create New Section</h4>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-indigo-800/30 border border-indigo-700/50 rounded-xl text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., Module 1: Introduction"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setAddingSectionMode(false)}
                    className="px-6 py-3 text-indigo-200 bg-indigo-800/50 border border-indigo-700/50 rounded-xl hover:bg-indigo-700/50 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl transition-all duration-300 font-medium shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Section'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingSectionMode(true)}
            className="group relative w-full overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-700/20 via-indigo-600/20 to-indigo-700/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative flex items-center justify-center py-6 px-8 bg-gradient-to-r from-indigo-900/60 to-indigo-800/60 border-2 border-dashed border-indigo-700/50 rounded-2xl group-hover:border-indigo-600/50 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-700/80 to-indigo-800/80 group-hover:from-indigo-600 group-hover:to-indigo-500 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg">
                  <PlusCircle className="h-6 w-6 text-indigo-300 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-indigo-200 group-hover:text-indigo-100 transition-colors">
                    Add New Section
                  </h4>
                  <p className="text-sm text-indigo-300 font-light">
                    Create a new section to organize your content
                  </p>
                </div>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseContentManagement; //test