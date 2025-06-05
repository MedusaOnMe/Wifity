import express, { Application } from 'express';
import http from 'http';
import multer from 'multer';
import openai, { testOpenAIConnection, generateImage, editImage, combineImages } from './openai';
import { storage } from './storage';
import { generateImageSchema } from '@shared/schema';
import { log } from './vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Fix for ESM modules where __dirname is not available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple job queue system
interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created: Date;
  completed?: Date;
  result?: any;
  error?: string;
  imageData?: {
    imagePath: string;
    tempPngPath: string;
  };
}

const jobQueue: Record<string, Job> = {};

// Cleanup old jobs periodically
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 1000; // 24 hours
  
  Object.keys(jobQueue).forEach(jobId => {
    const job = jobQueue[jobId];
    const jobAge = now.getTime() - job.created.getTime();
    
    if (jobAge > maxAge) {
      // Clean up image files
      if (job.imageData) {
        try {
          if (fs.existsSync(job.imageData.imagePath)) fs.unlinkSync(job.imageData.imagePath);
          if (fs.existsSync(job.imageData.tempPngPath)) fs.unlinkSync(job.imageData.tempPngPath);
        } catch (e) {
        }
      }
      
      // Remove job from queue
      delete jobQueue[jobId];
      log(`Cleaned up old job: ${jobId}`);
    }
  });
}, 60 * 60 * 1000); // Check every hour

// Process a job asynchronously
async function processImageEditJob(jobId: string, imageData: { imagePath: string; tempPngPath: string }, prompt: string, modelName: string) {
  try {
    // Update job status
    jobQueue[jobId].status = 'processing';
    log(`Processing job ${jobId} with prompt: "${prompt.substring(0, 30)}..."`);
    
    // Function to add retry logic for operations with network calls
    const retryOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 2000): Promise<any> => {
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error: any) {
          lastError = error;
          
          // Check if this is a network error
          const isNetworkError = 
            error.message?.includes('ECONNRESET') || 
            error.message?.includes('Connection error') ||
            error.message?.includes('network') ||
            error.code === 'ECONNRESET';
          
          if (!isNetworkError || attempt >= maxRetries) {
            throw error;
          }
          
          log(`Job ${jobId}: Network error, retrying (${attempt}/${maxRetries}): ${error.message}`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
      
      throw lastError;
    };
    
    // Debug the file content and metadata
    try {
      const fileStats = fs.statSync(imageData.tempPngPath);
      log(`Debug - File stats: Size=${fileStats.size}, isFile=${fileStats.isFile()}`);
      
      // Check file magic numbers to verify it's really a PNG
      const headerBuffer = Buffer.alloc(8);
      const fd = fs.openSync(imageData.tempPngPath, 'r');
      fs.readSync(fd, headerBuffer, 0, 8, 0);
      fs.closeSync(fd);
      
      const isPNG = headerBuffer.toString('hex').startsWith('89504e47');
    } catch (debugError: any) {
      log(`Debug - Error checking file: ${debugError.message}`);
    }
    
    // Try an alternative approach using direct API access, bypassing SDK transformations
    let response;
    
    if (modelName === "gpt-image-1") {
      // For gpt-image-1, create a custom direct implementation
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      // Add model and prompt fields
      formData.append('model', modelName);
      formData.append('prompt', prompt);
      formData.append('quality', 'low');
      
      // Add image file - important: use append for the file with the correct filename
      formData.append('image', fs.createReadStream(imageData.tempPngPath), {
        filename: 'image.png',
        contentType: 'image/png'
      });
      
      log(`Creating direct FormData API request with model=${modelName}`);
      
      // Make a direct API call without the SDK transformations
      const axios = (await import('axios')).default;
      
      response = await retryOperation(async () => {
        const apiKey = process.env.OPENAI_API_KEY;
        
        log(`Making direct API call to OpenAI for image editing with model=${modelName}`);
        
        const axiosResponse = await axios.post('https://api.openai.com/v1/images/edits', formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'multipart/form-data' // This might be set by formData.getHeaders()
          },
          maxBodyLength: Infinity
        });
        
        log(`Received direct API response with status ${axiosResponse.status}`);
        return axiosResponse.data;
      });
    } else {
      // For dall-e-2, use the OpenAI SDK as before
      // Read the file for the OpenAI API
      const imageBuffer = fs.readFileSync(imageData.tempPngPath);
      
      // Building request parameters
      const requestParams: any = {
        model: modelName,
        prompt: prompt,
        n: 1,
        image: {
          data: imageBuffer,
          name: 'image.png',
          type: 'image/png'
        },
        quality: "standard"
      };
      
      log(`Job ${jobId}: Calling OpenAI SDK with model=${modelName}`);
      
      // Use the SDK for dall-e-2
      response = await retryOperation(() => editImage(requestParams));
    }
    
    // Process response
    let imageUrl;
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      if ('url' in response.data[0] && response.data[0].url) {
        imageUrl = response.data[0].url as string;
      } else if ('b64_json' in response.data[0] && response.data[0].b64_json) {
        imageUrl = `data:image/png;base64,${response.data[0].b64_json as string}`;
      }
    } else if (typeof response.data === 'object' && response.data !== null) {
      if ('url' in response.data && response.data.url) {
        imageUrl = response.data.url as string;
      } else if ('b64_json' in response.data && response.data.b64_json) {
        imageUrl = `data:image/png;base64,${response.data.b64_json as string}`;
      }
    } else if (Array.isArray(response) && response.length > 0) {
      // Direct API response might have a different structure
      if ('url' in response[0] && response[0].url) {
        imageUrl = response[0].url as string;
      } else if ('b64_json' in response[0] && response[0].b64_json) {
        imageUrl = `data:image/png;base64,${response[0].b64_json as string}`;
      }
    } else if (typeof response === 'object' && response !== null) {
      if ('url' in response && response.url) {
        imageUrl = response.url as string;
      } else if ('b64_json' in response && response.b64_json) {
        imageUrl = `data:image/png;base64,${response.b64_json as string}`;
      } else if (response.data && response.data.url) {
        imageUrl = response.data.url as string;
      } else if (response.data && response.data.b64_json) {
        imageUrl = `data:image/png;base64,${response.data.b64_json as string}`;
      }
    }
    
    if (!imageUrl) {
      // Log the response structure for debugging
      log(`No image URL found in response. Response structure: ${JSON.stringify({
        hasData: !!response.data,
        dataType: response.data ? (Array.isArray(response.data) ? "array" : "object") : "none",
        responseType: typeof response,
        isArray: Array.isArray(response),
        keys: typeof response === 'object' ? Object.keys(response) : []
      })}`);
      throw new Error('No image URL found in response');
    }
    
    // Store the image in our database
    const image = await storage.createImage({
      prompt: `Edit: ${prompt}`,
      url: imageUrl,
      size: "1024x1024",
      userId: null,
    });
    
    // Update job status
    jobQueue[jobId].status = 'completed';
    jobQueue[jobId].completed = new Date();
    jobQueue[jobId].result = image;
    
    log(`Job ${jobId} completed successfully`);
    
    // Clean up temporary files
    try {
      if (fs.existsSync(imageData.imagePath)) fs.unlinkSync(imageData.imagePath);
      if (fs.existsSync(imageData.tempPngPath)) fs.unlinkSync(imageData.tempPngPath);
    } catch (e: any) {
    }
    
  } catch (error: any) {
    
    // Update job status
    jobQueue[jobId].status = 'failed';
    jobQueue[jobId].completed = new Date();
    jobQueue[jobId].error = error.message || 'Unknown error';
    
    // Clean up temporary files
    try {
      if (fs.existsSync(imageData.imagePath)) fs.unlinkSync(imageData.imagePath);
      if (fs.existsSync(imageData.tempPngPath)) fs.unlinkSync(imageData.tempPngPath);
    } catch (e) {
    }
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      log(`Upload directory created/verified: ${uploadDir}`);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const filename = `${uniqueSuffix}-${file.originalname}`;
      log(`Generated filename for upload: ${filename}`);
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    log(`Received file: ${file.originalname}, type: ${file.mimetype}`);
    if (!file.mimetype.startsWith('image/')) {
      log(`Rejected file: ${file.originalname} - not an image`);
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
}).single('image');

// Configure multer for multi-image uploads (up to 5 images)
const uploadMulti = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      log(`Upload directory created/verified: ${uploadDir}`);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const filename = `${uniqueSuffix}-${file.originalname}`;
      log(`Generated filename for upload: ${filename}`);
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    log(`Received file: ${file.originalname}, type: ${file.mimetype}`);
    if (!file.mimetype.startsWith('image/')) {
      log(`Rejected file: ${file.originalname} - not an image`);
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
}).fields([
  { name: 'image0', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]);

// Configure multer for dual image uploads
const uploadDual = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      log(`Upload directory created/verified: ${uploadDir}`);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const filename = `${uniqueSuffix}-${file.originalname}`;
      log(`Generated filename for upload: ${filename}`);
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    log(`Received file: ${file.originalname}, type: ${file.mimetype}`);
    if (!file.mimetype.startsWith('image/')) {
      log(`Rejected file: ${file.originalname} - not an image`);
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
}).fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]);

// OpenAI client is imported from ./openai.ts

export async function registerRoutes(app: Application) {
  // Create server outside the routes registration
  const server = http.createServer(app);

  // Test OpenAI connection at startup
  log('Testing OpenAI API connection at server startup...');
  try {
    const connectionValid = await testOpenAIConnection();
    if (!connectionValid) {
      log('WARNING: Server starting with invalid OpenAI configuration. Image operations will likely fail.');
    } else {
      log('OpenAI API connection verified successfully.');
    }
  } catch (error: any) {
    log(`ERROR: Failed to test OpenAI connection: ${error.message}`);
    console.error('Failed to test OpenAI connection:', error);
  }

  // API Routes
  app.get('/api/images', async (req, res) => {
    try {
      const images = await storage.getAllImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch images' });
    }
  });

  app.get('/api/images/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid image ID' });
      }

      const image = await storage.getImage(id);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      res.json(image);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch image' });
    }
  });

  app.post('/api/images/generate', async (req, res) => {
    try {
      const validationResult = generateImageSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request parameters',
          errors: validationResult.error.format() 
        });
      }
      
      const { prompt, size, quality, style } = validationResult.data;
      
      // Define model explicitly and log it clearly
      const modelName = "gpt-image-1";
      log(`IMPORTANT - Generating image with MODEL: "${modelName}" and prompt: "${prompt.slice(0, 30)}..."`);
      
      // Build request parameters based on model
      const requestParams: any = {
        model: modelName,
        prompt,
        n: 1,
        size
      };
      
      // Always use "medium" quality for gpt-image-1
      if (modelName === "gpt-image-1") {
        requestParams.quality = "medium";
      } else if (quality) {
        // For dall-e models, use the quality value as provided
        requestParams.quality = quality;
      }
      
      // Only include style for models that support it (dall-e-3)
      // gpt-image-1 doesn't support the style parameter
      if (style && modelName.includes('dall-e')) {
        requestParams.style = style;
      }
      
      
      const response = await generateImage(requestParams);
      
      // Simplified response logging
      
      // Add more robust response parsing for different possible response formats
      let imageUrl;
      
      // Try different possible response formats without excessive logging
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Add more detailed logging for debugging
        
        // Standard format with direct URL
        if ('url' in response.data[0] && response.data[0].url) {
          imageUrl = response.data[0].url as string;
        } 
        // Base64 data format
        else if ('b64_json' in response.data[0] && response.data[0].b64_json) {
          imageUrl = `data:image/png;base64,${response.data[0].b64_json as string}`;
        }
        // Log the revised prompt if available
      } else if (typeof response.data === 'object' && response.data !== null) {
        
        // Some APIs might return a single object rather than an array
        if ('url' in response.data && response.data.url) {
          imageUrl = response.data.url as string;
        } else if ('b64_json' in response.data && response.data.b64_json) {
          imageUrl = `data:image/png;base64,${response.data.b64_json as string}`;
        }
      }
      
      if (!imageUrl) {
        // If we couldn't find an image URL or base64 data through standard methods,
        // log the entire response structure as a last resort
        throw new Error('No image URL could be extracted from OpenAI response');
      }
      
      // Store image in our database
      const image = await storage.createImage({
        prompt,
        url: imageUrl,
        size,
        userId: null, // No user authentication in this app
      });
      
      res.json(image);
    } catch (error: any) {
      
      // Handle OpenAI API errors
      if (error.response) {
        return res.status(error.response.status || 500).json({
          message: 'OpenAI API error',
          error: error.response.data
        });
      }
      
      res.status(500).json({ message: 'Failed to generate image' });
    }
  });

  // Simple text-only generation endpoint
  app.post('/api/images/generate-text', async (req, res) => {
    try {
      const prompt = req.body.prompt;
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const modelName = "gpt-image-1";
      log(`Generating text-only image with prompt: "${prompt.slice(0, 50)}..."`);
      
      const requestParams = {
        model: modelName,
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium"
      };
      
      const response = await generateImage(requestParams);
      
      let imageUrl;
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        if ('url' in response.data[0] && response.data[0].url) {
          imageUrl = response.data[0].url as string;
        } else if ('b64_json' in response.data[0] && response.data[0].b64_json) {
          imageUrl = `data:image/png;base64,${response.data[0].b64_json as string}`;
        }
      }
      
      if (!imageUrl) {
        throw new Error('No image URL found in OpenAI response');
      }
      
      // Store image in database
      const image = await storage.createImage({
        prompt,
        url: imageUrl,
        size: "1024x1024",
        userId: null,
      });
      
      res.json(image);
    } catch (error: any) {
      log(`Error generating text-only image: ${error.message}`);
      
      if (error.response) {
        return res.status(error.response.status || 500).json({
          message: 'OpenAI API error',
          error: error.response.data
        });
      }
      
      res.status(500).json({ message: 'Failed to generate image' });
    }
  });

  // Endpoint for generating stack with multiple images
  app.post('/api/images/generate-stack', (req, res) => {
    uploadMulti(req, res, async (uploadErr) => {
      const imagePaths: string[] = [];
      
      try {
        if (uploadErr) {
          return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Get all uploaded images
        const uploadedImages: Buffer[] = [];
        for (let i = 0; i < 5; i++) {
          const fieldName = `image${i}`;
          if (files[fieldName] && files[fieldName][0]) {
            const imagePath = files[fieldName][0].path;
            imagePaths.push(imagePath);
            uploadedImages.push(fs.readFileSync(imagePath));
          }
        }

        if (uploadedImages.length === 0) {
          return res.status(400).json({ message: 'At least one image is required' });
        }

        log(`Generating stack with ${uploadedImages.length} images`);

        // Create a comprehensive prompt that preserves all main features of uploaded images
        const imagePreservationPrompt = `Create a realistic "wif" stacking format image using the uploaded reference images. CRITICAL REQUIREMENTS:
        
        1. PRESERVE ALL MAIN FEATURES: Each uploaded image contains important subjects, objects, characters, or elements that MUST be preserved exactly as they appear - maintain their colors, shapes, distinctive features, clothing, expressions, poses, and visual characteristics.
        
        2. STACKING FORMAT: Stack all the main subjects/objects from the uploaded images vertically from bottom to top like a totem pole or tower. Each element should be clearly visible and properly proportioned.
        
        3. VISUAL FIDELITY: Keep the essential visual details of each uploaded image - if there's a person, maintain their appearance; if there's an object, keep its design and colors; if there's an animal, preserve its species and characteristics.
        
        4. COMPOSITION: Ensure all elements are visually connected in the stack, with realistic lighting, shadows, and depth. No floating elements.
        
        5. BACKGROUND: Use a neutral photographic background that complements the stacked elements.
        
        6. QUALITY: Generate a high-quality, photorealistic result that honors the source material while creating a cohesive stacked composition.
        
        The goal is to create a single image that showcases all the main subjects from the uploaded images in a stacked totem format while preserving their individual characteristics and visual integrity.`;

        // Use image editing API to incorporate the uploaded images
        const response = await editImage({
          model: "gpt-image-1",
          image: uploadedImages, // Pass the actual image data
          prompt: imagePreservationPrompt,
          n: 1,
          size: "1024x1024",
          quality: "medium"
        });
        
        let imageUrl;
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          if ('url' in response.data[0] && response.data[0].url) {
            imageUrl = response.data[0].url as string;
          } else if ('b64_json' in response.data[0] && response.data[0].b64_json) {
            imageUrl = `data:image/png;base64,${response.data[0].b64_json as string}`;
          }
        }
        
        if (!imageUrl) {
          throw new Error('No image URL found in OpenAI response');
        }
        
        // Store image in database
        const image = await storage.createImage({
          prompt: `Wifify Stack: Created from ${uploadedImages.length} uploaded image${uploadedImages.length > 1 ? 's' : ''}`,
          url: imageUrl,
          size: "1024x1024",
          userId: null,
        });
        
        // Clean up temporary files
        imagePaths.forEach(path => {
          try {
            if (fs.existsSync(path)) fs.unlinkSync(path);
          } catch (e) {}
        });
        
        res.json(image);
        
      } catch (error: any) {
        log(`Error generating stack: ${error.message}`);
        
        // Clean up files
        imagePaths.forEach(path => {
          try {
            if (fs.existsSync(path)) fs.unlinkSync(path);
          } catch (e) {}
        });
        
        if (error.response) {
          return res.status(error.response.status || 500).json({
            message: 'OpenAI API error',
            error: error.response.data
          });
        }
        
        res.status(500).json({ message: 'Failed to generate stack' });
      }
    });
  });

  // Endpoint for combining two images
  app.post('/api/images/combine', (req, res) => {
    // Check API key status upfront
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'Server configuration error: OpenAI API key is not configured',
        api_configured: false
      });
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return res.status(500).json({
        message: 'Server configuration error: OpenAI API key appears invalid',
        api_configured: false
      });
    }
    
    // Set up response content type for consistency
    res.setHeader('Content-Type', 'application/json');
    
    // Use multer to handle dual file upload
    uploadDual(req, res, async (uploadErr) => {
      let imagePath1 = '';
      let imagePath2 = '';
      
      try {
        // Check for upload errors
        if (uploadErr) {
          return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
        }

        // Validate request
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || !files.image1 || !files.image2 || !files.image1[0] || !files.image2[0]) {
          return res.status(400).json({ message: 'Both images are required' });
        }
        
        const prompt = req.body.prompt;
        if (!prompt) {
          return res.status(400).json({ message: 'Prompt is required' });
        }
        
        // Save the image paths
        imagePath1 = files.image1[0].path;
        imagePath2 = files.image2[0].path;
        
        log(`Processing image combination with prompt: "${prompt.substring(0, 50)}..."`);
        
        // Read the image files
        const image1Buffer = fs.readFileSync(imagePath1);
        const image2Buffer = fs.readFileSync(imagePath2);
        
        // Call OpenAI to combine the images
        const response = await combineImages(image1Buffer, image2Buffer, prompt);
        
        // Process response to get image URL
        let imageUrl;
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          if ('url' in response.data[0] && response.data[0].url) {
            imageUrl = response.data[0].url as string;
          } else if ('b64_json' in response.data[0] && response.data[0].b64_json) {
            imageUrl = `data:image/png;base64,${response.data[0].b64_json as string}`;
          }
        }
        
        if (!imageUrl) {
          throw new Error('No image URL found in OpenAI response');
        }
        
        // Store image in our database
        const image = await storage.createImage({
          prompt: `Wifify: ${prompt.substring(0, 100)}`,
          url: imageUrl,
          size: "1024x1024",
          userId: null,
        });
        
        // Clean up temporary files
        try {
          if (fs.existsSync(imagePath1)) fs.unlinkSync(imagePath1);
          if (fs.existsSync(imagePath2)) fs.unlinkSync(imagePath2);
        } catch (e) {
          log(`Warning: Failed to clean up temporary files: ${e}`);
        }
        
        res.json(image);
        
      } catch (error: any) {
        log(`Error combining images: ${error.message}`);
        
        // Clean up any files
        if (imagePath1 && fs.existsSync(imagePath1)) {
          try { fs.unlinkSync(imagePath1); } catch (e) {}
        }
        if (imagePath2 && fs.existsSync(imagePath2)) {
          try { fs.unlinkSync(imagePath2); } catch (e) {}
        }
        
        // Handle OpenAI API errors
        if (error.response) {
          return res.status(error.response.status || 500).json({
            message: 'OpenAI API error',
            error: error.response.data
          });
        }
        
        return res.status(500).json({ 
          message: error.message || 'Error combining images'
        });
      }
    });
  });

  // Endpoints for the asynchronous job system
  app.post('/api/images/edit/create-job', (req, res) => {
    
    // Check API key status upfront
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'Server configuration error: OpenAI API key is not configured',
        api_configured: false
      });
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return res.status(500).json({
        message: 'Server configuration error: OpenAI API key appears invalid',
        api_configured: false
      });
    }
    
    
    // Set up response content type for consistency
    res.setHeader('Content-Type', 'application/json');
    
    // Use multer to handle file upload
    upload(req, res, async (uploadErr) => {
      let imagePath = '';
      let tempPngPath = '';
      
      try {
        // Check for upload errors
        if (uploadErr) {
          return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
        }

        // Validate request
        if (!req.file) {
          return res.status(400).json({ message: 'No image uploaded' });
        }
        
        const prompt = req.body.prompt;
        if (!prompt) {
          return res.status(400).json({ message: 'Prompt is required' });
        }
        
        // Save the image path
        imagePath = req.file.path;
        
        // Ensure the image is in PNG format with transparency (required by OpenAI)
        tempPngPath = `${imagePath}.png`;
        
        // Convert to PNG with alpha channel
        await sharp(imagePath)
          .ensureAlpha()
          .resize(512, 512, { fit: 'inside' }) // Reduce to 512x512 max for better performance
          .toFormat('png')
          .withMetadata() // Keep essential metadata
          .toFile(tempPngPath);
        
        
        // Verify PNG file exists and has content
        if (!fs.existsSync(tempPngPath) || fs.statSync(tempPngPath).size === 0) {
          throw new Error('Failed to create valid PNG image');
        }
        
        // Define model explicitly
        const modelName = "gpt-image-1";
        
        // Create a job ID
        const jobId = crypto.randomBytes(16).toString('hex');
        
        // Add job to the queue
        jobQueue[jobId] = {
          id: jobId,
          status: 'pending',
          created: new Date(),
          imageData: {
            imagePath,
            tempPngPath
          }
        };
        
        // Start processing the job asynchronously
        processImageEditJob(jobId, { imagePath, tempPngPath }, prompt, modelName)
          .catch(error => {
          });
        
        // Return the job ID immediately
        return res.status(202).json({
          jobId,
          message: 'Image edit job created. You can check the status using the /api/jobs/:id endpoint',
          status: 'pending'
        });
        
      } catch (error: any) {
        
        // Clean up any files
        if (imagePath && fs.existsSync(imagePath)) {
          try { fs.unlinkSync(imagePath); } catch (e) {}
        }
        if (tempPngPath && fs.existsSync(tempPngPath)) {
          try { fs.unlinkSync(tempPngPath); } catch (e) {}
        }
        
        return res.status(500).json({ 
          message: error.message || 'Error processing image',
        });
      }
    });
  });
  
  // Endpoint to check job status
  app.get('/api/jobs/:id', (req, res) => {
    const jobId = req.params.id;
    
    // Check if job exists
    if (!jobQueue[jobId]) {
      return res.status(404).json({
        message: 'Job not found',
        jobId
      });
    }
    
    const job = jobQueue[jobId];
    
    // If job is complete, return the result and clean it up (but keep record)
    if (job.status === 'completed') {
      return res.status(200).json({
        jobId,
        status: job.status,
        result: job.result,
        completed: job.completed
      });
    }
    
    // If job failed, return the error
    if (job.status === 'failed') {
      return res.status(200).json({
        jobId,
        status: job.status,
        error: job.error,
        completed: job.completed
      });
    }
    
    // Job is still in progress
    return res.status(200).json({
      jobId,
      status: job.status,
      message: job.status === 'pending' ? 'Job is waiting to be processed' : 'Job is currently processing',
      created: job.created
              });
            });
            
  // Legacy endpoint for direct image editing (keeping for compatibility)
  app.post('/api/images/edit', (req, res) => {
    
    // Use multer to handle file upload and forward to job creation endpoint
    upload(req, res, async (uploadErr) => {
      if (uploadErr) {
        return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
      }
      
      // Validate request
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      
      const prompt = req.body.prompt;
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      try {
        // Save the image path
        const imagePath = req.file.path;
        
        // Ensure the image is in PNG format with transparency
        const tempPngPath = `${imagePath}.png`;
        
        // Convert to PNG with alpha channel
        await sharp(imagePath)
          .ensureAlpha()
          .resize(512, 512, { fit: 'inside' }) // Reduce to 512x512 max for better performance
          .toFormat('png')
          .withMetadata() // Keep essential metadata
          .toFile(tempPngPath);
        
        // Define model
        const modelName = "gpt-image-1";
        
        // Create a job ID
        const jobId = crypto.randomBytes(16).toString('hex');
        
        // Add job to the queue
        jobQueue[jobId] = {
          id: jobId,
          status: 'pending',
          created: new Date(),
          imageData: {
            imagePath,
            tempPngPath
          }
        };
        
        // Start processing the job asynchronously
        processImageEditJob(jobId, { imagePath, tempPngPath }, prompt, modelName)
          .catch(error => {
          });
        
        // Poll the job until it completes or fails (max 5 minutes)
        const maxWaitTime = 5 * 60 * 1000; // 5 minutes
        const pollInterval = 2000; // 2 seconds
        const startTime = Date.now();
        
        const checkJobCompletion = async () => {
          // Get the latest job status
          const job = jobQueue[jobId];
          
          if (!job) {
            return res.status(500).json({
              message: 'Job was unexpectedly removed from the queue'
            });
          }
          
          // If job is complete, return the result
          if (job.status === 'completed') {
            return res.status(200).json(job.result);
          }
          
          // If job failed, return the error
          if (job.status === 'failed') {
            return res.status(500).json({
              message: `OpenAI API Error: ${job.error}`
            });
          }
          
          // Check if we've waited too long
          if (Date.now() - startTime > maxWaitTime) {
            return res.status(504).json({
              message: 'Request timed out after 5 minutes. Try again with a smaller image or simpler prompt.',
              jobId
            });
          }
          
          // Wait and check again
          setTimeout(checkJobCompletion, pollInterval);
        };
        
        // Start polling
        setTimeout(checkJobCompletion, pollInterval);
        
      } catch (error: any) {
        return res.status(500).json({ 
          message: error.message || 'Error processing image'
        });
      }
    });
  });

  return server;
} 