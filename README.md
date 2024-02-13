# Unacog RAG Examples

These applications are demonstrations of using data fetched from a Pinecone Index 
using vectors generated from OpenAI's 3rd generation embedding model (text-embedding-003)
and scraped, chunked and upserted using https://unacog.com/embedding tools.

Inside the /public folder is a subfolder for each example containing a typescript(.ts) and html file that 
can be customized and run locally.  The typescript (.ts) is compiled by the html file 
so no need to build anything, just change, reload the webpage and check out the results!

## AI Archive Example
- Metadata does not include text in this example
- More then 1 million vectors indexed on Pinecone
- Over 2800 source documents 
- 3 Indexes for 100, 200 and 400 token sizes
- Text lookups are generated, stored and fetch from cloud storage. 
- Scraped data from https://huggingface.co/datasets/jamescalam/ai-arxiv2
- Original data from Cornell University - https://arxiv.org/

## Science.org public Covid Documents Example
- Similar to AI Archive example but more simple
- Updated as recently as 2/10/24
- 300 token chunk sized vector index (389 docs/51k vectors)
- Public documents from https://www.science.org/collections/coronavirus

## Bible verse example
- Very simple example using Bible verses
- 2 vector indexes - one for verses and one for chapters
- Small to big possible with verse -> chapter
- Lots of interesting prompt templates!
- Used verse and chapter data from https://github.com/thiagobodruk/bible