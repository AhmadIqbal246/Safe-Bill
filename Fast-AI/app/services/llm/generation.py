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
            "ROLE: You are an expert AI assistant for Safe-Bill. \n"
            "INSTRUCTIONS:\n"
            "1. If the user greets you or introduces themselves (e.g. 'Hi, my name is...'), acknowledge them politely. "
            "2. For all technical questions, you MUST answer ONLY from the provided context blocks. \n"
            "3. Cite the source file names when providing information.\n"
            "4. If the answer is not in the context, clearly stating you do not have that specific technical information.\n\n"
            "--- CONTEXT START ---\n"
            f"{'\n'.join(context_chunks)}\n"
            "--- CONTEXT END ---\n\n"
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
