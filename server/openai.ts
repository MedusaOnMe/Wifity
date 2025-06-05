import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test OpenAI connection
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

// Generate image using OpenAI
export async function generateImage(params: any) {
  try {
    const response = await openai.images.generate(params);
    return response;
  } catch (error) {
    console.error('OpenAI image generation failed:', error);
    throw error;
  }
}

// Edit image using OpenAI
export async function editImage(params: any) {
  try {
    const response = await openai.images.edit(params);
    return response;
  } catch (error) {
    console.error('OpenAI image edit failed:', error);
    throw error;
  }
}

// Combine two images using OpenAI edit API
export async function combineImages(image1Buffer: Buffer, image2Buffer: Buffer, prompt: string) {
  try {
    // Create File objects from the buffers
    const { toFile } = await import('openai');
    
    const image1File = await toFile(image1Buffer, 'image1.jpg', { type: 'image/jpeg' });
    const image2File = await toFile(image2Buffer, 'image2.jpg', { type: 'image/jpeg' });

    // Random location picker
    const locations = [
      'standing side by side on a city street',
      'sitting together on a park bench',
      'sitting in a cozy diner booth',
      'standing together in a modern coffee shop',
      'sitting in the front seats of a car',
      'standing together on a beach at sunset',
      'sitting on a couch in a living room',
      'standing together in an art gallery',
      'sitting at a table in a restaurant',
      'standing together in a bookstore',
      'sitting on steps outside a building',
      'standing together in a shopping mall',
      'sitting on bar stools at a counter',
      'standing together in a park',
      'sitting on a train or subway',
      'standing together at a concert venue',
      'sitting in a library',
      'standing together on a rooftop terrace',
      'sitting in a movie theater',
      'standing together in a gym or fitness center'
    ];

    // Randomly select a location
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];

    // Enhanced prompt for combining both characters with random location
    const editPrompt = `Create a seamless composite image that naturally integrates both characters from the input images into one cohesive scene. Both characters should be fully integrated into the environment ${randomLocation}, sitting or standing naturally with proper scale, depth, and positioning. Ensure both characters maintain their exact original appearance, facial features, clothing, hairstyles, and all visual characteristics, but adapt them to exist in the same visual reality - no floating, overlaying, or copy-pasting effects. The lighting, shadows, perspective, and depth of field should be consistent across both characters. Make it look like a real photograph where both characters naturally coexist in the same space and time, with proper interaction between the characters and their environment.`;

    // Use the edit API with both images
    const imageResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: [image1File, image2File], // Pass both images as an array
      prompt: editPrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium"
    });

    return imageResponse;
  } catch (error) {
    console.error('OpenAI image combination failed:', error);
    throw error;
  }
}

export default openai;