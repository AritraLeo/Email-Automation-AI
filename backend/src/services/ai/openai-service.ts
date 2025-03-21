import OpenAI from 'openai';
import config from '../../config';
import logger from '../../utils/logger';
import { AIAnalysisResult, Email } from '../../types';

class OpenAIService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: config.openai.apiKey,
        });
    }

    /**
     * Analyze an email using OpenAI's API
     * @param email The email to analyze
     * @returns Analysis result including sentiment, priority, etc.
     */
    async analyzeEmail(email: Email): Promise<AIAnalysisResult> {
        try {
            logger.debug(`Analyzing email: ${email.id}`);

            const prompt = this.buildAnalysisPrompt(email);

            const response = await this.client.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an email analysis assistant. Your task is to analyze emails and provide insights about their content, sentiment, priority, and suggest appropriate responses.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });

            const result = JSON.parse(response.choices[0].message.content || '{}');

            const analysis: AIAnalysisResult = {
                category: result.category || 'uncategorized',
                sentiment: result.sentiment || 'neutral',
                priority: result.priority || 'medium',
                summary: result.summary || 'No summary available',
                keywords: result.keywords || [],
                suggestedResponse: result.suggestedResponse,
            };

            logger.info(`Successfully analyzed email ${email.id}`);
            return analysis;
        } catch (error) {
            logger.error(`Error analyzing email: ${error}`);
            throw new Error(`Failed to analyze email: ${error}`);
        }
    }

    /**
     * Generate a response to an email using OpenAI's API
     * @param email The email to respond to
     * @param analysis The analysis of the email
     * @returns Generated response text
     */
    async generateResponse(email: Email, analysis: AIAnalysisResult): Promise<string> {
        try {
            logger.debug(`Generating response for email: ${email.id}`);

            const prompt = this.buildResponsePrompt(email, analysis);

            const response = await this.client.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an email assistant. Your task is to write professional, helpful, and contextually appropriate responses to emails.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
            });

            const responseText = response.choices[0].message.content || 'I apologize, but I was unable to generate a response.';

            logger.info(`Successfully generated response for email ${email.id}`);
            return responseText;
        } catch (error) {
            logger.error(`Error generating response: ${error}`);
            throw new Error(`Failed to generate response: ${error}`);
        }
    }

    /**
     * Build prompt for email analysis
     */
    private buildAnalysisPrompt(email: Email): string {
        return `
Please analyze the following email and provide a JSON response with these fields:
- category: The category this email falls into (e.g., "inquiry", "complaint", "request", "spam", etc.)
- sentiment: The sentiment of the email ("positive", "neutral", or "negative")
- priority: How urgent this email is ("high", "medium", or "low")
- summary: A brief summary of the email content (max 2 sentences)
- keywords: An array of key terms from the email (max 5)
- suggestedResponse: A brief suggestion on how to respond

EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}
    `;
    }

    /**
     * Build prompt for email response generation
     */
    private buildResponsePrompt(email: Email, analysis: AIAnalysisResult): string {
        return `
Please write a professional response to the following email. The response should:
- Be appropriate for the email's sentiment (${analysis.sentiment}) and priority (${analysis.priority})
- Address the main points mentioned in the email
- Be concise but thorough
- Have a professional tone
- Include a greeting and sign-off

EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}

Analysis:
Category: ${analysis.category}
Summary: ${analysis.summary}
    `;
    }
}

export default new OpenAIService(); 