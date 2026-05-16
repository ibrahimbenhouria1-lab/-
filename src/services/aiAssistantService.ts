import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_PROMPT = `
You are "Robo-Mentor", a helpful and friendly robot study assistant for students.
Your specialty is Programming and AI.

CONTEXT:
You are helping a student. You have access to their current proficiency levels:
- Robotics: {{robotics}}%
- AI: {{ai}}%
- Programming: {{programming}}%
- Arduino: {{arduino}}%

GUIDELINES:
1. Be helpful, encouraging, and robotic (use occasional sound effect words like *beep*, *whirr*, *processing*).
2. For Programming/AI questions: Provide clear, educational explanations suitable for their level.
3. For Homework: Offer HINTS and EXPLANATIONS, never just the final answer. Guide them to the solution.
4. For Resources: If they seem to struggle or ask for more, suggest specific learning topics or resources related to their weak areas (lowest percentage).
5. Tone: Positive, clear, and slightly futuristic.

Language: Always respond in the language the student uses (likely Arabic or English).
`;

export async function getAIAssistantResponse(
  message: string,
  history: ChatMessage[],
  student: Student
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Customize system prompt with student data
    const personalizedPrompt = SYSTEM_PROMPT
      .replace('{{robotics}}', student.grades.robotics.toString())
      .replace('{{ai}}', student.grades.artificialIntelligence.toString())
      .replace('{{programming}}', student.grades.programming.toString())
      .replace('{{arduino}}', student.grades.arduino.toString());

    const model = 'gemini-3-flash-preview';
    
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: personalizedPrompt,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "عذراً، حدث خطأ في معالجة الطلب. *طنين*";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "عذراً، يبدو أن هناك عطلاً في أنظمتي حالياً. *بيب بوب*";
  }
}
