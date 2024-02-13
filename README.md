# Unacog RAG Examples

These applications are demonstrations of using data fetched from a Pinecone Index 
using vectors generated from OpenAI's 3rd generation embedding model (text-embedding-003)
and scraped, chunked and upserted using https://unacog.com/embedding tools.

## AI Archive Example
- Metadata does not include text in this example
- More then 1 million vectors indexed on Pinecone
- Over 2800 source documents 
- 3 Indexes for 100, 200 and 400 token sizes
- Text lookups are generated, stored and fetch from cloud storage. 
- Original data from https://huggingface.co/datasets/jamescalam/ai-arxiv2

## Science.org public Covid Documents Example
- Public documents from https://www.science.org/collections/coronavirus
- Updated as recently as 2/10/24
- 1 vector index using 300 token size
- Similar to AI Archive example but more simple

## Bible verse example
- Very simple example using Bible verses
- 2 vector indexes - one for verses and one for chapters
- Small to big possible with verse -> chapter
- Lots of interesting prompt templates!