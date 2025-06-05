import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test OpenAI connection
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured - using dummy key for development');
      return false;
    }
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
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
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
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    const response = await openai.images.edit(params);
    return response;
  } catch (error) {
    console.error('OpenAI image edit failed:', error);
    throw error;
  }
}

// Combine two images using OpenAI Vision
export async function combineImages(image1Buffer: Buffer, image2Buffer: Buffer, prompt: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    // Convert buffers to base64
    const image1Base64 = image1Buffer.toString('base64');
    const image2Base64 = image2Buffer.toString('base64');
    
    // Use Vision API to analyze both images and generate a combined description
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image1Base64}`
              }
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image2Base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    // Extract the description from the vision response
    const combinedDescription = visionResponse.choices[0]?.message?.content || 
      "Two characters seamlessly merged into one cohesive scene";

    // Generate the final combined image
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: combinedDescription,
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