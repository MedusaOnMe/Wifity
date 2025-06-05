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
    const editPrompt = `Create a seamless composite image where both characters from the input images are naturally positioned ${randomLocation}. Both characters should maintain their exact original visual style - if one is cartoon/animated and one is realistic, keep them that way. IMPORTANT: Ensure both characters are properly grounded and positioned in the environment - no floating, hovering, or overlaid effects. Both characters should be sitting/standing on the same surfaces with proper contact with the ground/furniture. The lighting should affect both characters appropriately for the environment, and they should cast realistic shadows. Make sure both characters appear to truly exist in the same 3D space with proper depth, scale, and spatial relationships, while preserving their individual visual styles completely unchanged.`;

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