export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  try {
    // Step 1: translate non-Marathi text → Marathi (optional)
    const transRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/ai4bharat/IndicTrans2-en-mr",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    const transData = await transRes.json();
    const marathiInput =
      transData?.[0]?.translation_text ||
      transData?.translation_text ||
      text;

    // Step 2: generate Marathi text using GPT2
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/gpt2-medium",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `मराठीत उत्तर द्या: ${marathiInput}`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.9,
            top_p: 0.9,
          },
          options: { wait_for_model: true },
        }),
      }
    );

    const result = await response.json();

    const output =
      result?.[0]?.generated_text ||
      result?.generated_text ||
      "AI ने उत्तर दिलं नाही.";

    res.status(200).json({ reply: output.trim() });
  } catch (err) {
    console.error("Hugging Face Error:", err);
    res.status(500).json({ error: err.message });
  }
}
