from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag import (
    rag,QueryParam
)
from resp import chat,chat2,chat3
from vid import video_to_text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest1(BaseModel):
    path:str

class QueryRequest2(BaseModel):
    query:str

class QueryRequest3(BaseModel):
    summaries:list


@app.post("/query2")
async def get_response(request: QueryRequest2):
    query=request.query
    context = rag.query(query, param=QueryParam(mode="hybrid",only_need_context=True))
    response = chat.predict(query=query, context_str=context)
    return {"response": response}

@app.post("/add")
async def insert(request: QueryRequest2):
    path=request.path
    output_folder = f""
    text = video_to_text(path,output_folder)
    rag.insert(text)
    print("Sucessfully Inserted")
    summary = chat2.predict(content=text)
    return {"summary":summary}

@app.post("/summary")
async def insert(request: QueryRequest3):
    summary=request.summaries
    combined_summary = ""
    for i, string in enumerate(summary, start=1):
        combined_summary += f"Summary{i} : {string}\n"
    total_summary = chat3.predict(content=combined_summary)
    return {"final_summary":total_summary}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
