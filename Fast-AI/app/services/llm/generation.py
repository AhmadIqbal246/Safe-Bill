from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.chat import MessagePrompt

class LLMService:
    def __init__(self):
        # OpenRouter acts as an OpenAI drop-in replacement.
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.model = settings.LLM_MODEL
        
    async def generate_response_stream(self, messages: list[MessagePrompt], context_chunks: list[str]):
        """Generates the RAG answer via OpenRouter and streams chunks back."""
        
        # Inject the retrieved knowledge into the system prompt
        system_msg = {
            "role": "system",
            "content": (
                "You are an expert AI assistant for Safe-Bill. Answer the user's question accurately "
                "using ONLY the provided context blocks below. If the answer is not in the context, "
                "say you do not know. Do not hallucinate.\n\n"
                "--- CONTEXT ---\n" + 
                "\n\n".join(context_chunks) + "\n"
                "--- END CONTEXT ---"
            )
        }
        
        # Prepare the final array
        api_messages = [system_msg] + [m.model_dump() for m in messages]
        
        # Stream response
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=api_messages,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

llm_service = LLMService()
