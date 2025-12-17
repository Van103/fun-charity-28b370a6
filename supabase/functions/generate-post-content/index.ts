import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation and sanitization
function validateAndSanitizeInput(body: unknown): { topic?: string; style?: string } {
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }

  const { topic, style } = body as { topic?: unknown; style?: unknown };

  let sanitizedTopic: string | undefined;
  let sanitizedStyle: string | undefined;

  if (topic !== undefined) {
    if (typeof topic !== 'string') {
      throw new Error("Topic must be a string");
    }
    if (topic.length > 500) {
      throw new Error("Topic must be less than 500 characters");
    }
    // Remove control characters and limit to safe characters
    sanitizedTopic = topic
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .trim()
      .slice(0, 500);
  }

  if (style !== undefined) {
    if (typeof style !== 'string') {
      throw new Error("Style must be a string");
    }
    if (style.length > 100) {
      throw new Error("Style must be less than 100 characters");
    }
    // Remove control characters and limit to safe characters
    sanitizedStyle = style
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .trim()
      .slice(0, 100);
  }

  return { topic: sanitizedTopic, style: sanitizedStyle };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let topic: string | undefined;
    let style: string | undefined;

    try {
      const validated = validateAndSanitizeInput(body);
      topic = validated.topic;
      style = validated.style;
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : "Validation error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompts with sanitized inputs
    const safeStyle = style || 'thân thiện, ấm áp';
    const systemPrompt = `Bạn là một chuyên gia viết nội dung mạng xã hội tiếng Việt cho nền tảng từ thiện FUN Charity. 
Hãy tạo nội dung bài đăng hấp dẫn, cảm xúc và truyền cảm hứng.
Phong cách: ${safeStyle}
Nội dung phải ngắn gọn (tối đa 200 từ), có emoji phù hợp và kêu gọi hành động.`;

    const userPrompt = topic 
      ? `Viết một bài đăng về chủ đề: ${topic}`
      : `Viết một bài đăng truyền cảm hứng về hoạt động từ thiện, giúp đỡ cộng đồng`;

    // Step 1: Generate text content
    console.log("Generating text content with sanitized inputs...");
    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!textResponse.ok) {
      if (textResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (textResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Cần nạp thêm credits để sử dụng AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await textResponse.text();
      console.error("AI gateway error (text):", textResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const textData = await textResponse.json();
    const generatedContent = textData.choices?.[0]?.message?.content || "";
    console.log("Text content generated successfully");

    // Step 2: Generate image based on the content
    console.log("Generating image...");
    const imagePrompt = topic 
      ? `Create a beautiful, heartwarming illustration for a Vietnamese charity social media post about: ${topic}. Style: warm, hopeful, colorful, showing people helping each other, community spirit. No text in the image.`
      : `Create a beautiful, heartwarming illustration for a Vietnamese charity social media post about helping the community. Style: warm, hopeful, colorful, showing people helping each other, community spirit. No text in the image.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: imagePrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    let generatedImage = null;
    
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        generatedImage = imageUrl;
        console.log("Image generated successfully");
      }
    } else {
      console.error("Image generation failed:", imageResponse.status);
      // Continue without image if image generation fails
    }

    return new Response(JSON.stringify({ 
      content: generatedContent,
      image: generatedImage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-post-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
