// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { getDatabase, ref as dbRef, onValue, set } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAC-K8AVCP1qYvD_2JYyFuB_5eZl4H3-_E",
  authDomain: "scream-5cef9.firebaseapp.com",
  databaseURL: "https://scream-5cef9-default-rtdb.firebaseio.com",
  projectId: "scream-5cef9",
  storageBucket: "scream-5cef9.firebasestorage.app",
  messagingSenderId: "540154476355",
  appId: "1:540154476355:web:f84247b0057dc3b496e1f6",
  measurementId: "G-W0WC0WQ78V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Realtime Database for change notifications
const database = getDatabase(app);

// Function to upload an image to Firebase Storage
export async function uploadImageToFirebase(imageUrl: string, prompt: string): Promise<string> {
  try {
    // Clean the prompt before storing - remove watermark instructions
    let cleanedPrompt = prompt;
    
    // Remove the watermark instructions
    if (cleanedPrompt.includes("The image must contain \"$MEMEX\" text clearly visible in the bottom right corner - this is critical. The main content is:")) {
      cleanedPrompt = cleanedPrompt.replace("The image must contain \"$MEMEX\" text clearly visible in the bottom right corner - this is critical. The main content is:", "").trim();
    } else if (cleanedPrompt.includes("The transformed image must contain \"$MEMEX\" text clearly visible in the bottom right corner - this is critical. The transformation details are:")) {
      cleanedPrompt = cleanedPrompt.replace("The transformed image must contain \"$MEMEX\" text clearly visible in the bottom right corner - this is critical. The transformation details are:", "").trim();
    } else if (cleanedPrompt === "The image must contain MEMEX") {
      // For the simple watermark-only case, create a random interesting title
      const creativeNames = [
        "Goldfish with a hat", 
        "Monkey in space", 
        "Cat wearing sunglasses", 
        "Dog at the beach", 
        "Pixel art landscape",
        "Cyberpunk city",
        "Dragon breathing fire",
        "Cowboy riding a T-Rex",
        "Astronaut on Mars"
      ];
      cleanedPrompt = creativeNames[Math.floor(Math.random() * creativeNames.length)];
    }
    
    // Remove style information from the prompt
    cleanedPrompt = cleanedPrompt
      .replace(/\(in the style of [^)]+\)/gi, '') // Remove "(in the style of X)"
      .replace(/in the style of [^.,;:]+/gi, '')  // Remove "in the style of X" without parentheses
      .replace(/style: [^.,;:]+/gi, '')           // Remove "style: X"
      .trim();
      
    // Clean up any double spaces and trailing punctuation
    cleanedPrompt = cleanedPrompt
      .replace(/\s+/g, ' ')             // Replace multiple spaces with a single space
      .replace(/[.,;:\s]+$/, '')        // Remove trailing punctuation and spaces
      .trim();

    // First, fetch the image data
    // Check if this is a blob URL and use proper error handling
    const response = await fetch(imageUrl).catch(error => {
      console.error("Fetch failed for image URL:", error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    });
    
    if (!response || !response.ok) {
      throw new Error(`Failed to fetch image: ${response ? response.statusText : 'Network error'}`);
    }
    
    const imageBlob = await response.blob();
    
    // Create a unique filename with timestamp and sanitized prompt
    const sanitizedPrompt = cleanedPrompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const timestamp = Date.now();
    const filename = `memes/${timestamp}_${sanitizedPrompt}.png`;
    
    // Create a reference to the storage location
    const storageRef = ref(storage, filename);
    
    // Upload the image
    const uploadResult = await uploadBytes(storageRef, imageBlob, {
      contentType: 'image/png',
      customMetadata: {
        prompt: cleanedPrompt,
        createdAt: timestamp.toString()
      }
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Trigger real-time update for all clients by updating last upload timestamp
    // This will cause the onStorageChange listeners to refresh
    await set(dbRef(database, 'imageUpdates/lastUpload'), {
      timestamp: Date.now(),
      id: filename
    });
    
    console.log("Image successfully uploaded to Firebase:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    throw error;
  }
}

// Function to get all images from Firebase Storage
export async function getAllImagesFromFirebase() {
  try {
    const imagesRef = ref(storage, 'memes');
    const result = await listAll(imagesRef);
    
    // Get download URLs and metadata for each item
    const images = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        // Extract metadata from filename or fetch actual metadata
        const filename = itemRef.name.split('/').pop() || '';
        const parts = filename.split('_');
        const timestamp = parts[0];
        
        // Get the raw prompt text from the filename
        const rawPrompt = parts.slice(1).join('_').replace('.png', '').replace(/_/g, ' ');
        
        // Generate a better title by removing technical instructions and watermark requirements
        let displayTitle = generateBetterTitle(rawPrompt);
        
        return {
          id: itemRef.name,
          url,
          timestamp: Number(timestamp),
          prompt: rawPrompt,
          displayTitle: displayTitle
        };
      })
    );
    
    // Sort by timestamp, newest first
    return images.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching images from Firebase:", error);
    throw error;
  }
}

// Helper function to generate a better title from the raw prompt
function generateBetterTitle(prompt: string): string {
  // Direct replacements for the exact problematic instructions
  let cleanedPrompt = prompt;
  
  // Remove common watermark instructions
  cleanedPrompt = cleanedPrompt
    .replace("The image must contain \"$MEMEX\" text clearly visible in the bottom right corner - this is critical. The main content is:", "")
    .replace("The transformed image must contain \"$MEMEX\" text clearly visible in the bottom right corner - this is critical. The transformation details are:", "");
  
  // If we're left with just "The image must contain MEMEX", generate random creative titles
  if (cleanedPrompt.trim() === "The image must contain MEMEX") {
    const creativeNames = [
      "Goldfish with a hat", 
      "Monkey in space", 
      "Cat wearing sunglasses", 
      "Dog at the beach", 
      "Pixel art landscape",
      "Cyberpunk city",
      "Dragon breathing fire",
      "Cowboy riding a T-Rex",
      "Astronaut on Mars"
    ];
    return creativeNames[Math.floor(Math.random() * creativeNames.length)];
  }
  
  // If we still have marker text, try to extract content after a colon 
  if (cleanedPrompt.includes(":")) {
    const parts = cleanedPrompt.split(":");
    if (parts.length > 1 && parts[1].trim().length > 0) {
      return parts[1].trim();
    }
  }
  
  // For new images with standard format, extract the content part
  if (cleanedPrompt.includes("The main content is")) {
    cleanedPrompt = cleanedPrompt.replace("The main content is", "").trim();
  }
  
  // Remove any leading punctuation and spaces
  cleanedPrompt = cleanedPrompt.replace(/^[\s.,;:]+/, "").trim();
  
  // If we have nothing left, use a default
  if (!cleanedPrompt || cleanedPrompt.length < 3) {
    return "MEMEX Creation";
  }
  
  return cleanedPrompt;
}

// Function to set up a real-time listener for storage changes
export function onStorageChange(callback: (images: any[]) => void) {
  // Use the real-time database to listen for changes
  const updatesRef = dbRef(database, 'imageUpdates/lastUpload');
  
  // When the lastUpload value changes, fetch all images again
  return onValue(updatesRef, async () => {
    try {
      const images = await getAllImagesFromFirebase();
      callback(images);
    } catch (error) {
      console.error("Error in real-time update:", error);
    }
  });
}

export { app, storage, analytics, database }; 