import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class AISummaryService {
  static async generateMainPoints(title: string, description: string): Promise<string[]> {
    try {
      const prompt = `Analyze this video content and extract 5 main points or key takeaways. 
      
Title: ${title}
Description: ${description}

Please respond with a JSON object containing an array of main points. Each point should be concise and informative.
Format: {"main_points": ["point 1", "point 2", "point 3", "point 4", "point 5"]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert content analyzer. Extract key points from video content in a structured format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{"main_points": []}');
      return result.main_points || [];
    } catch (error) {
      console.error('Failed to generate main points:', error);
      return [
        'Unable to generate main points at this time',
        'Please try again later or contact support'
      ];
    }
  }

  static async generateSummary(title: string, description: string): Promise<string> {
    try {
      const prompt = `Create a concise, engaging summary of this video content in 1-2 sentences.
      
Title: ${title}
Description: ${description}

Focus on the core message and value proposition. Make it compelling and informative.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert content summarizer. Create engaging, concise summaries that capture the essence of video content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      return response.choices[0].message.content || 'Unable to generate summary at this time.';
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return 'Unable to generate AI summary at this time. Please try again later.';
    }
  }
}
