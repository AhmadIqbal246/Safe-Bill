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
        
        # We use a single-message strategy for Gemma 3 / Google AI Studio compatibility.
        # We take the previous chat history but wrap the LAST user message inside the context.
        
        history = [m.model_dump() for m in messages[:-1]]
        last_query = messages[-1].content
        
        rag_prompt = (
            "SYSTEM INSTRUCTIONS:\n"
            "You are an expert AI assistant for Safe-Bill. Answer the user's question accurately "
            "using ONLY the provided context blocks below. If the answer is not in the context, "
            "say you do not know. Do not hallucinate. Citation: Mention the source file names when possible.\n\n"
            "--- START CONTEXT ---\n"
            f"{'\n'.join(context_chunks)}\n"
            "--- END CONTEXT ---\n\n"
            f"USER QUESTION: {last_query}"
        )
        
        # The final set of messages: History (if any) + the new RAG-wrapped message
        api_messages = history + [{"role": "user", "content": rag_prompt}]
        
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
