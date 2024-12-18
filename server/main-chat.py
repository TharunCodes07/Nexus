from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag import (
    rag,QueryParam
)
from resp import chat,chat2,chat3
from vid import video_to_text, pdf_to_text
import os

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


@app.post("/pdf2word")
async def convert_pdf_to_word(request: QueryRequest1):
    try:
        path = request.path
        document = pdf_to_text(path)
        rag.insert(document)
        
        return {"text": document}
        
    except Exception as e:
        print(f"Error converting PDF: {str(e)}")
        return {"error": "Failed to convert PDF"}

@app.post("/video2word")
async def convert_video_to_word(request: QueryRequest1):
    try:
        path = request.path
        document = video_to_text(path)
        rag.insert(document)
        return {"text": document}
    except Exception as e:
        print(f"Error converting video: {str(e)}")
        return {"error": "Failed to convert video"}
    
@app.post("/query")
async def query(request:QueryRequest2):
    try:
        query= request.query
        context = rag.query(query,param=QueryParam(mode="hybrid"))
        response = chat.predict(query=query,context=context)
        return {"response":response}
    except Exception as e:
        return {"Error": "Failed to query"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
