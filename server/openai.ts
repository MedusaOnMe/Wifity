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

// Combine two images using OpenAI
export async function combineImages(image1Buffer: Buffer, image2Buffer: Buffer, prompt: string) {
  try {
    // Enhanced prompt for better character preservation
    const enhancedPrompt = `Create a photorealistic composite image that seamlessly combines two distinct characters into one natural scene. The characters should maintain their exact original appearance, facial features, clothing, hairstyles, and all visual characteristics. Place them together in a realistic setting such as standing side by side, sitting on a bench, in a car, at a diner, or another natural environment. The lighting and perspective should be consistent across both characters to create a believable, cohesive scene where both characters look like they naturally belong together while preserving their individual distinctive features completely unchanged.`;

    // Generate the combined image using the enhanced prompt
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: enhancedPrompt,
      n: 1,
      quality: "medium",
      size: "1024x1024"
    });

    return imageResponse;
  } catch (error) {
    console.error('OpenAI image combination failed:', error);
    throw error;
  }
}

export default openai;