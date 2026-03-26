import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export default function aiGenerateRoutes() {
  const router = Router();

  router.post('/job-description', async (req, res) => {
    const { jobTitle, seniority, department } = req.body;
    if (!jobTitle) return res.status(400).json({ error: 'jobTitle is required' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.json({
        generated: true,
        content: generateFallbackJD(jobTitle, seniority, department),
        note: 'Generated locally (no ANTHROPIC_API_KEY configured). Add your API key to server/.env for AI-powered generation.',
      });
    }

    try {
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Generate a professional, inclusive job description for the following role:

Title: ${jobTitle}
Seniority: ${seniority || 'Mid-level'}
Department: ${department || 'Not specified'}

Include these sections:
1. Job Title & Summary (2-3 sentences)
2. Key Responsibilities (5-7 bullet points)
3. Required Qualifications (4-5 bullet points)
4. Preferred Qualifications (3-4 bullet points)
5. What We Offer (4-5 bullet points about benefits/culture)

Use inclusive language. Focus on skills and outcomes rather than years of experience. Format with markdown.`
        }],
      });

      const content = message.content[0]?.text || 'No response generated.';
      res.json({ generated: true, content });
    } catch (err) {
      console.error('Anthropic API error:', err.message);
      res.json({
        generated: true,
        content: generateFallbackJD(jobTitle, seniority, department),
        note: 'Generated locally (API error). Check your ANTHROPIC_API_KEY.',
      });
    }
  });

  return router;
}

function generateFallbackJD(title, seniority, department) {
  return `# ${seniority || 'Mid-level'} ${title}
**Department:** ${department || 'Engineering'}

## About the Role
We are looking for a talented ${title} to join our ${department || 'team'}. This ${(seniority || 'mid-level').toLowerCase()} role offers an opportunity to make a meaningful impact while growing your career in a supportive, innovative environment.

## Key Responsibilities
- Deliver high-quality outcomes in collaboration with cross-functional partners
- Design and implement scalable solutions aligned with business objectives
- Mentor team members and contribute to a culture of continuous learning
- Use data-driven approaches to inform decisions and iterate quickly
- Participate in planning, code reviews, and architecture discussions

## Required Qualifications
- Demonstrated expertise in core ${title.toLowerCase()} competencies
- Strong analytical and problem-solving skills
- Excellent written and verbal communication abilities
- Track record of delivering impactful projects

## Preferred Qualifications
- Experience with modern tools and frameworks in the domain
- Background in agile or iterative development methodologies
- Familiarity with data analytics and automation

## What We Offer
- Competitive compensation and comprehensive benefits
- Flexible working arrangements and generous PTO
- Professional development budget and learning opportunities
- Inclusive, diverse workplace culture
- Opportunity to shape the future of HR technology

*This is a demo-generated job description. Configure your ANTHROPIC_API_KEY for AI-powered generation.*`;
}
