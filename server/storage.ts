import { users, images, type User, type InsertUser, type Image, type InsertImage } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Image methods
  createImage(image: Omit<InsertImage, "userId"> & { userId: number | null }): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  getAllImages(): Promise<Image[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private images: Map<number, Image>;
  userCurrentId: number;
  imageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.images = new Map();
    this.userCurrentId = 1;
    this.imageCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Image methods
  async createImage(imageData: Omit<InsertImage, "userId"> & { userId: number | null }): Promise<Image> {
    const id = this.imageCurrentId++;
    const now = new Date();
    
    const image: Image = {
      id,
      prompt: imageData.prompt,
      url: imageData.url,
      size: imageData.size,
      userId: imageData.userId,
      createdAt: now
    };
    
    this.images.set(id, image);
    return image;
  }
  
  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }
  
  async getAllImages(): Promise<Image[]> {
    // Sort by creation date, newest first
    return Array.from(this.images.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
