import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateImage } from "./openai";
import { generateImageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to generate an image
  app.post("/api/images/generate", async (req, res) => {
    try {
      // Validate the request body
      const validatedBody = generateImageSchema.parse(req.body);
      const { prompt, size, quality, style } = validatedBody;
      
      // Check if OpenAI API key is set
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable." 
        });
      }
      
      // Call OpenAI to generate the image
      const imageUrl = await generateImage(prompt, size, quality, style as "vivid" | "natural");
      
      // Save the image info to storage
      const image = await storage.createImage({
        prompt,
        url: imageUrl,
        size,
        userId: null,  // We're not implementing auth in this demo
      });
      
      return res.status(200).json(image);
    } catch (error) {
      console.error("Error generating image:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  });
  
  // API endpoint to get all images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getAllImages();
      return res.status(200).json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  });
  
  // API endpoint to get a specific image by ID
  app.get("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      const image = await storage.getImage(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      return res.status(200).json(image);
    } catch (error) {
      console.error("Error fetching image:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
