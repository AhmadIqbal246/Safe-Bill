from datetime import datetime
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.chat import MessagePrompt

class LLMService:
    def __init__(self):
        # Determine the base URL and API key based on available settings
        if settings.GROQ_API_KEY:
            self.base_url = "https://api.groq.com/openai/v1"
            self.api_key = settings.GROQ_API_KEY
            self.provider = "Groq"
        elif settings.OPENROUTER_API_KEY:
            self.base_url = "https://openrouter.ai/api/v1"
            self.api_key = settings.OPENROUTER_API_KEY
            self.provider = "OpenRouter"
        else:
            raise ValueError("No LLM API Key provided! Please check your .env file.")

        self.client = AsyncOpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )
        self.model = settings.LLM_MODEL
        
    async def generate_response_stream(self, messages: list[MessagePrompt], context_chunks: list[str]):
        """Generates the RAG answer via OpenRouter and streams chunks back."""
        
        # Current time for temporal context
        current_time = datetime.now().strftime("%A, %B %d, %Y (%H:%M:%S)")
        
        # Prepare history for the API call 
        # We map history to the format OpenRouter expects (role/content)
        history = [{"role": m.role, "content": m.content} for m in messages[:-1]]
        last_query = messages[-1].content
        
        # 1. PERSONA & HIERARCHY (System Instructions)
        system_msg = (
            f"ROLE: You are the Elite Support Lead for Safe-Bill. Your tone is sophisticated, high-end, and professional.\n"
            f"CURRENT DATETIME: {current_time}\n"
            "HIERARCHY OF TRUTH:\n"
            "1. CONTEXTUAL MEMORY: Use chat history to recall user details. IMPORTANT: Do not repeat greetings or the user's name in every single response. Mention their name only when it feels natural for a high-end concierge.\n"
            "2. TEMPORAL AWARENESS: Use the CURRENT DATETIME above for all date/time calculations. NEVER be evasive or say 'I would need to know the date'. Do the math and give exact dates.\n"
            "3. TECHNICAL MANUAL: Use 'SAFE-BILL CONTEXT' for platform/technical questions. DO NOT invent facts not in the context.\n"
            "4. FLOW: Maintain a flowing conversation. If you already introduced yourself, get straight to the facts in the next turn.\n"
        )
        
        # 2. FINAL PROMPT (Technical Chunks + Memory Reminder)
        rag_prompt = (
            "--- SAFE-BILL TECHNICAL CONTEXT (for platform questions) ---\n"
            f"{'\n'.join(context_chunks) if context_chunks else 'No relevant manual pages found for this specific query.'}\n"
            "--- END CONTEXT ---\n\n"
            f"MEMORY REMINDER: If the user just asked who they are or for personal details, ignore the manual above and use your history.\n\n"
            f"USER QUERY: {last_query}"
        )
        
        # 3. CONSOLIDATED MESSAGE STACK
        # We place the History BEFORE the RAG-wrapped latest query
        api_messages = [{"role": "system", "content": system_msg}] + history + [{"role": "user", "content": rag_prompt}]
        
        # 4. EXECUTE LLM CALL
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                stream=True,
                temperature=0.3 # Lower temperature for consistency
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"ERROR in LLM stream: {e}")
            yield "I encountered a brief connection error. Please try sending your request again."

llm_service = LLMService()
