import os
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_groq import ChatGroq


def convo_template(llm):
    template = '''Answer the question. A context has been provided which may or may not be helpful, utilise it to gather futher information if it is useful.

    Question: {query}

    Context: 

    Respond with only the answer, do not add anything unnecessary.
    '''
    prompt = PromptTemplate(input_variables=['query'], template=template)
    conversation = LLMChain(llm=llm, prompt=prompt, verbose=False)
    return conversation

def summary_template(llm):
    template = '''Summary Prompt
    '''
    prompt = PromptTemplate(input_variables=['query', 'context'], template=template)
    conversation = LLMChain(llm=llm, prompt=prompt, verbose=False)
    return conversation

def total_template(llm):
    template = '''Total summary prompt
    '''
    prompt = PromptTemplate(input_variables=['query', 'context'], template=template)
    conversation = LLMChain(llm=llm, prompt=prompt, verbose=False)
    return conversation

llm = ChatGroq(
    groq_api_key=os.getenv('GROQ_API_KEY'),
    model_name='llama-3.1-70b-versatile')
chat = convo_template(llm)
chat2= summary_template(llm)
chat3 = total_template(llm)