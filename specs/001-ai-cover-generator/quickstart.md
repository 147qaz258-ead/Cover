# Quick Start Guide: AI Cover Generator

**Purpose**: Get the AI Cover Generator running locally in under 10 minutes

## Prerequisites

- Node.js 18+ (recommended: use nvm)
- npm or yarn
- Git
- Vercel account (for deployment)
- Cloudflare account (for R2 storage)

## 1. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd cover

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

## 2. Environment Configuration

Edit `.env.local` with your API keys:

```bash
# AI Services
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
NANO_BANANA_API_KEY=your_nano_banana_key
QWEN_API_KEY=your_qwen_api_key

# Storage
CLOUDFLARE_R2_ACCOUNT_ID=your_r2_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=ai-cover-images

# Optional: User System
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EDGE_RUNTIME=true
```

## 3. Running Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 4. Testing the Flow

### Generate Your First Cover

1. **Enter Text**: Paste an article title or paragraph
2. **Select Style**: Choose from predefined styles (e.g., "Minimalist", "Bold", "Artistic")
3. **Choose Platforms**: Select one or more platforms (小红书, 公众号, 商品)
4. **Click Generate**: Wait 20-30 seconds for results

### Expected Flow:
1. Text is analyzed by AI agent
2. Title and key points are extracted
3. Multiple covers are generated for selected platforms
4. Results are displayed with editing options

## 5. Key Components

### Frontend Components

```typescript
// Main cover generator interface
import { CoverGenerator } from "@/components/covers/cover-generator";

// Text input and analysis
import { TextInput } from "@/components/forms/text-input";
import { StyleSelector } from "@/components/forms/style-selector";

// Result display
import { CoverGallery } from "@/components/covers/cover-gallery";
import { CoverEditor } from "@/components/covers/cover-editor";
```

### Backend API Routes

```typescript
// Main generation endpoint
POST /api/generate

// Job status polling
GET /api/generate/[jobId]

// Text analysis only
POST /api/analyze

// Templates and styles
GET /api/templates
GET /api/styles
```

### AI Agent Integration

```typescript
// LangChain agent setup
import { createTextAnalyzer } from "@/lib/ai/text-analyzer";
import { createTitleGenerator } from "@/lib/ai/title-generator";
import { createImageGenerator } from "@/lib/ai/image-generator";

// Agent chain execution
const result = await runAgentChain(input, {
  textAnalyzer: createTextAnalyzer("openai"),
  titleGenerator: createTitleGenerator("gemini"),
  imageGenerator: createImageGenerator("nano-banana"),
});
```

## 6. Adding a New AI Provider

Example: Adding a new image generation service

```typescript
// lib/ai/providers/new-provider.ts
import { ImageProvider } from "@/types/ai";

export const newProvider: ImageProvider = {
  id: "new-provider",
  name: "New AI Service",
  generateImage: async (input) => {
    const response = await fetch("https://api.new-provider.com/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEW_PROVIDER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input.prompt,
        size: `${input.width}x${input.height}`,
      }),
    });

    return response.json();
  },
};

// lib/ai/image-generator.ts
import { newProvider } from "./providers/new-provider";

const providers = {
  "nano-banana": nanoBananaProvider,
  "qwen": qwenProvider,
  "new-provider": newProvider, // Add new provider
};
```

## 7. Creating Custom Templates

```typescript
// data/templates/custom-template.json
{
  "id": "custom-xiaohongshu",
  "name": "Custom Xiaohongshu Template",
  "platform": "xiaohongshu",
  "aspectRatio": "9:16",
  "elements": [
    {
      "id": "title",
      "type": "title",
      "position": { "x": 0, "y": 200, "width": 1080, "height": 300 },
      "style": {
        "fontFamily": "Inter",
        "fontSize": 48,
        "fontWeight": "bold",
        "color": "#FFFFFF"
      },
      "dynamic": true
    },
    {
      "id": "background",
      "type": "background",
      "position": { "x": 0, "y": 0, "width": 1080, "height": 1920 },
      "style": {
        "backgroundColor": "#000000"
      },
      "dynamic": false
    }
  ]
}
```

## 8. Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Setup R2 Storage

1. Create R2 bucket in Cloudflare dashboard
2. Add custom domain for image serving
3. Update environment variables with R2 credentials

## 9. Monitoring

### View Logs

```bash
# Vercel logs
vercel logs

# Local development
npm run dev  # Logs shown in terminal
```

### Performance Monitoring

- Generation time tracking
- AI provider success rates
- Error rate monitoring
- User analytics (if implemented)

## 10. Common Issues

### Generation Fails

1. Check API keys in `.env.local`
2. Verify AI provider credits
3. Check rate limits
4. Review error logs

### Slow Generation

1. Enable Edge Runtime: `export const runtime = "edge"`
2. Implement caching
3. Use streaming responses
4. Optimize prompt sizes

### Image Upload Issues

1. Verify R2 credentials
2. Check CORS settings
3. Ensure bucket permissions
4. Validate image formats

## 11. Development Tips

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=ai-cover:* npm run dev
```

## 12. Next Steps

1. **Add More Styles**: Create style templates for different niches
2. **Implement User System**: Add authentication with Supabase
3. **Batch Processing**: Allow bulk cover generation
4. **Analytics**: Track generation patterns and user preferences
5. **A/B Testing**: Test different prompts and templates

## Need Help?

- Check the [documentation](/docs)
- Review [common issues](/docs/troubleshooting)
- Open an issue on GitHub
- Join our Discord community