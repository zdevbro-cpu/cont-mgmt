import 'dotenv/config';

console.log('ANTHROPIC_API_KEY 존재:', !!process.env.ANTHROPIC_API_KEY);
console.log('ANTHROPIC_API_KEY 길이:', process.env.ANTHROPIC_API_KEY?.length || 0);
console.log('첫 10자:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));