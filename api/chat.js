export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  try {
    // Updated Hugging Face endpoint (new router)
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/ai4bharat/indic-gpt",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `मराठीत उत्तर द्या: ${text}`,
          parameters: {
            max_new_tokens: 120,
            temperature: 0.9,
            top_p: 0.95,
            repetition_penalty: 1.05,
          },
          options: { wait_for_model: true },
        }),
      }
    );

    const result = await response.json();

    // Extract text safely
    const output =
      result?.[0]?.generated_text ||
      result?.generated_text ||
      result?.message ||
      "AI ने उत्तर दिलं नाही.";

    res.status(200).json({ reply: output.trim() });
  } catch (err) {
    console.error("Hugging Face Error:", err);
    res.status(500).json({ error: err.message });
  }
}
