# Ollama Setup Guide - Local AI for Your Finance Platform

## What is Ollama?
Ollama runs large language models locally on your computer. No API costs, no quotas, complete privacy!

## Quick Start (5 minutes)

### 1. Install Ollama
Download and install from: **https://ollama.ai**

### 2. Start Ollama Server
Open terminal/PowerShell and run:
```bash
ollama serve
```
✅ Server will start on `http://localhost:11434`

### 3. Pull Required Models (First time only)
Open a **new terminal** (keep the server running) and run:

```bash
# For text tasks (categorization, analysis, etc.)
ollama pull mistral

# For vision/OCR tasks (receipt reading)
ollama pull llava
```

This downloads the models (~4-8GB each, one-time download).

### 4. Restart Your Dev Server
```bash
npm run dev
```

✅ **Done!** All AI features now run locally!

---

## Models Explained

### Mistral (Text)
- **Size**: ~7B parameters
- **Speed**: Fast ⚡
- **Quality**: Excellent for finance tasks
- **RAM**: 8GB minimum
- **Perfect for**: Categorization, analysis, recommendations

### LLaVA (Vision)
- **Size**: ~13B parameters  
- **Speed**: Medium (few seconds per receipt)
- **Quality**: Good for receipt OCR
- **RAM**: 16GB minimum (8GB might work)
- **Perfect for**: Receipt image analysis

---

## Troubleshooting

### "Connection refused" error
**Problem**: Ollama server not running
**Solution**: 
```bash
ollama serve
```
Make sure you keep this terminal window open!

### "Model not found" error
**Problem**: Models not downloaded
**Solution**:
```bash
ollama pull mistral
ollama pull llava
```

### Slow responses
**Problem**: Your computer doesn't have enough RAM
**Solution**: 
- Close other apps
- Upgrade to 16GB RAM
- Or use smaller models: `ollama pull neural-chat`

### Out of memory
**Problem**: Not enough RAM for models
**Solution**: 
- Use a smaller model: `ollama pull tinyllama` (3B)
- Or only run text model (skip OCR)

---

## Alternative Models

If Mistral is too slow for your computer, try:

```bash
# Faster, smaller (3B)
ollama pull neural-chat

# Fastest, smallest (2.7B)
ollama pull tinyllama

# Better quality, slower (70B) - needs 64GB RAM
ollama pull llama2-uncensored
```

To use a different model, update `.env.local`:
```env
OLLAMA_TEXT_MODEL=neural-chat
```

---

## Performance Tips

1. **Close unnecessary apps** - Free up RAM
2. **Use GPU if available** - Ollama auto-detects NVIDIA/AMD GPUs
3. **Increase timeouts** - Large models take 5-10 seconds
4. **Run at night** - Background downloads don't slow you down

---

## How Much Storage/RAM Do I Need?

| Model | Storage | RAM Needed | Speed |
|-------|---------|-----------|-------|
| Mistral | 4GB | 8GB | Good ⚡ |
| LLaVA | 8GB | 16GB | Medium 🐢 |
| Neural-Chat | 2GB | 4GB | Fast ⚡⚡ |
| TinyLlama | 1GB | 2GB | Very Fast ⚡⚡⚡ |

---

## Verify It's Working

Create a test transaction:
1. Go to dashboard → "Create Transaction"
2. Type in description: "Starbucks coffee"
3. Enter amount: "5.50"
4. Wait 2-3 seconds for AI suggestion
5. ✅ Should see "✨ AI suggests: Dining 95%"

If it works, everything is set up correctly!

---

## Next Steps

- **📸 Test Receipt OCR**: Upload a receipt photo
- **📊 View Insights**: Go to `/insights` page
- **💡 Create Transactions**: Try auto-categorization

Enjoy your free, private, offline AI finance platform! 🚀
