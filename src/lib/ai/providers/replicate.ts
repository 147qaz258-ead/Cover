import Replicate from "replicate";

export class ReplicateProvider {
  private client: Replicate;

  constructor(apiToken: string) {
    this.client = new Replicate({
      auth: apiToken,
    });
  }

  async generateImage(prompt: string, options?: {
    model?: string;
    width?: number;
    height?: number;
    num_outputs?: number;
    num_inference_steps?: number;
    guidance_scale?: number;
  }) {
    const model = options?.model || "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4";

    const input = {
      prompt,
      width: options?.width || 1024,
      height: options?.height || 1024,
      num_outputs: options?.num_outputs || 1,
      num_inference_steps: options?.num_inference_steps || 20,
      guidance_scale: options?.guidance_scale || 7.5,
    };

    const output = await this.client.run(model as any, { input });
    return output as unknown as string[];
  }

  async upscaleImage(imageUrl: string, options?: {
    model?: string;
    scale?: number;
  }) {
    const model = options?.model || "stability-ai/srgan:c50a21c93eb9e4259317571984944e1b16b7409e0d56429266b95e69342c7f1f";

    const input = {
      image: imageUrl,
      scale: options?.scale || 4,
    };

    const output = await this.client.run(model as any, { input });
    return output as unknown as string;
  }
}

// Singleton instance
let replicateInstance: ReplicateProvider | null = null;

export function getReplicateProvider(): ReplicateProvider {
  if (!replicateInstance) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error("Replicate API token not configured");
    }
    replicateInstance = new ReplicateProvider(apiToken);
  }
  return replicateInstance;
}