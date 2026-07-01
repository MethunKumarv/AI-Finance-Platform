// Utility to call Ollama locally
// Make sure Ollama is running: ollama serve

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || "mistral";
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llava";

export async function callOllama(prompt, model = TEXT_MODEL, isVision = false) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "";
  } catch (error) {
    console.error("Ollama error:", error);
    throw error;
  }
}

export async function callOllamaVision(imageBase64, prompt, model = VISION_MODEL) {
  try {
    // For vision, we need to send the image as base64 with the prompt
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        images: [imageBase64],
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "";
  } catch (error) {
    console.error("Ollama Vision error:", error);
    throw error;
  }
}
