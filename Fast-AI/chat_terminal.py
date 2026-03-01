import asyncio
import os
import sys
from app.pipelines.query_engine import query_engine
from app.schemas.chat import ChatRequest, MessagePrompt

async def run_chat():
    print("--- Safe-Bill RAG Terminal Test ---")
    print("Type 'exit' to quit.\n")
    
    history = []
    
    while True:
        query = input("Ask a question about Safe-Bill Docs: ")
        if query.lower() in ['exit', 'quit']:
            break
            
        if not query.strip():
            continue
            
        # Add user message to history
        history.append(MessagePrompt(role="user", content=query))
        
        print("\nSearching and Generating Answer...\n" + "-"*30)
        
        # Prepare the request with full history
        request = ChatRequest(
            messages=history,
            stream=True
        )
        
        print("AI RESPONSE:", end=" ", flush=True)
        
        # Stream the response directly to the terminal
        full_response = ""
        try:
            async for chunk in query_engine.answer_query(request):
                print(chunk, end="", flush=True)
                full_response += chunk
            print("\n" + "-"*30 + "\n")
            
            # Add AI response to history for next turn
            history.append(MessagePrompt(role="assistant", content=full_response))
            
        except Exception as e:
            print(f"\nError: {str(e)}")

if __name__ == "__main__":
    # Ensure we can find the app modules
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(run_chat())
