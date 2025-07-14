// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  FirebaseStorage,
  UploadTaskSnapshot,
  uploadBytesResumable
} from 'firebase/storage';

// Your web app's Firebase configuration
// Replace these with your actual Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let storage: FirebaseStorage | undefined;

// Initialize Firebase only if no apps are initialized
if (typeof window !== 'undefined' && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

/**
 * Upload a file to Firebase Storage
 * This is a client-side only function
 * @param file The file to upload
 * @param path The path to save the file to
 * @param onProgress Optional callback for tracking upload progress
 * @returns A promise that resolves to the download URL of the uploaded file
 */
export async function uploadFile(
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> {
  // Make sure we're in the browser environment
  if (typeof window === 'undefined') {
    throw new Error('Cannot upload files from server-side');
  }

  // Ensure we have a storage instance
  if (!storage) {
    const apps = getApps();
    if (!apps.length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = apps[0];
    }
    storage = getStorage(app);
  }

  const storageRef = ref(storage, path);
  
  // If progress tracking is needed, use the uploadBytesResumable API
  if (onProgress) {
    return new Promise((resolve, reject) => {
      try {
        // Create an upload task
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Register observers for progress tracking
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(progress);
          },
          (error: Error) => {
            // Handle errors
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            // Upload completed successfully, get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (urlError) {
              reject(urlError);
            }
          }
        );
      } catch (error) {
        // Fallback to simple upload if uploadBytesResumable is not available
        console.warn('Fallback to simple upload method');
        uploadBytes(storageRef, file)
          .then(() => getDownloadURL(storageRef))
          .then(resolve)
          .catch(reject);
      }
    });
  }
  
  // Simple upload without progress tracking
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete a file from Firebase Storage
 * This is a client-side only function
 * @param path The path of the file to delete
 * @returns A promise that resolves when the file is deleted
 */
export async function deleteFile(path: string): Promise<void> {
  // Make sure we're in the browser environment
  if (typeof window === 'undefined') {
    throw new Error('Cannot delete files from server-side');
  }

  // Ensure we have a storage instance
  if (!storage) {
    const apps = getApps();
    if (!apps.length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = apps[0];
    }
    storage = getStorage(app);
  }

  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export { storage }; 