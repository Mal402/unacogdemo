export const prompts =
  [
    {
      "id": "romantic",
      "title": "Romantic",
      "description": "Analyze romantic content by assessing emotional intensity, relationship dynamics, use of imagery/symbolism for love, and tone. Focus on language that conveys affection, longing, companionship, or conflict within relationships. Evaluate how effectively the text portrays deep connections, sensuality, and the philosophical aspects of love.",
      "prompt": "Rate the following song 0-10, regarding its \"romantic\" content. Guideline for \"romantic\" metrics: Analyze romantic content by assessing emotional intensity, relationship dynamics, use of imagery/symbolism for love, and tone. Focus on language that conveys affection, longing, companionship, or conflict within relationships. Evaluate how effectively the text portrays deep connections, sensuality, and the philosophical aspects of love. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "motivational",
      "title": "Motivational",
      "description": "Assess motivational/inspirational content by evaluating the presence of uplifting language, the ability to evoke resilience, ambition, and positive change. Consider how effectively the text encourages self-improvement, overcoming challenges, and pursuing goals. Look for narrative strength, real-life applicability, and the inspirational impact on the reader's mindset and actions.",
      "prompt": "Rate the following song 0-10, regarding its \"motivational\" content. Guideline for \"motivational\" metrics: Assess motivational/inspirational content by evaluating the presence of uplifting language, the ability to evoke resilience, ambition, and positive change. Consider how effectively the text encourages self-improvement, overcoming challenges, and pursuing goals. Look for narrative strength, real-life applicability, and the inspirational impact on the reader's mindset and actions. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "seasonal",
      "title": "Seasonal",
      "description": "For seasonal content, evaluate the depiction of specific seasons or holidays through imagery, traditions, and cultural symbols. Assess how effectively the text captures the essence of the season, including its emotional mood, atmospheric details, and associated activities or celebrations. Consider the use of language that evokes seasonal changes, festivities, and the impact on human experiences and behaviors.",
      "prompt": "Rate the following song 0-10, regarding its \"seasonal\" content. Guideline for \"seasonal\" metrics: For seasonal content, evaluate the depiction of specific seasons or holidays through imagery, traditions, and cultural symbols. Assess how effectively the text captures the essence of the season, including its emotional mood, atmospheric details, and associated activities or celebrations. Consider the use of language that evokes seasonal changes, festivities, and the impact on human experiences and behaviors. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "mature",
      "title": "Mature",
      "description": "Evaluate mature content by identifying explicit references to violence, sexual acts, drug use, and mature themes. Assess intensity, explicitness, and context. Consider language and imagery that depict or imply adult situations, aggression, or substance abuse. Gauge the impact on the narrative and its appropriateness for various audiences.",
      "prompt": "Rate the following song 0-10, regarding its \"mature\" content. Guideline for \"mature\" metrics: Evaluate mature content by identifying explicit references to violence, sexual acts, drug use, and mature themes. Assess intensity, explicitness, and context. Consider language and imagery that depict or imply adult situations, aggression, or substance abuse. Gauge the impact on the narrative and its appropriateness for various audiences. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "inappropriatelanguage",
      "title": "Language",
      "description": "For language content, evaluate the presence and context of profanity, slurs, and vulgar expressions. Consider the frequency and intensity of inappropriate language, considering its impact on the narrative or message. Consider if such language serves a stylistic or thematic purpose. Note the audience appropriateness and cultural sensitivity of the expressions used.",
      "prompt": "Rate the following song 0-10, regarding its \"inappropriate language\" content. Guideline for \"inappropriate language\" metrics: For language content, evaluate the presence and context of profanity, slurs, and vulgar expressions. Consider the frequency and intensity of inappropriate language, considering its impact on the narrative or message. Consider if such language serves a stylistic or thematic purpose. Note the audience appropriateness and cultural sensitivity of the expressions used. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "violent",
      "title": "Violent",
      "description": "Evaluate violent content by identifying acts of aggression, harm, or destruction. Assess descriptions of physical, conflict intensity, and the impact on individuals or groups. Focus on language depicting harm, fear, coercion, and the consequences of violent acts. Consider the context, justification, and portrayal of violence, distinguishing between glorification, critique, or neutral depiction.",
      "prompt": "Rate the following song 0-10, regarding its \"violent\" content. Guideline for \"violent\" metrics: Evaluate violent content by identifying acts of aggression, harm, or destruction. Assess descriptions of physical, conflict intensity, and the impact on individuals or groups. Focus on language depicting harm, fear, coercion, and the consequences of violent acts. Consider the context, justification, and portrayal of violence, distinguishing between glorification, critique, or neutral depiction. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "political",
      "title": "Political",
      "description": "For political content, evaluate the presence of governance critique, societal commentary, and advocacy for change. Analyze language for references to political ideologies, policies, power dynamics, and social justice. Assess how the text addresses authority, civil rights, and the impact of governance on individuals and communities. Consider the depth of analysis and the call for action or reflection on political issues.",
      "prompt": "Rate the following song 0-10, regarding its \"political\" content. Guideline for \"political\" metrics: For political content, evaluate the presence of governance critique, societal commentary, and advocacy for change. Analyze language for references to political ideologies, policies, power dynamics, and social justice. Assess how the text addresses authority, civil rights, and the impact of governance on individuals and communities. Consider the depth of analysis and the call for action or reflection on political issues. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "religious",
      "title": "Religious",
      "description": "Evaluate religious content by identifying explicit references to religions (e.g., Christianity, Islam), their practices, symbols, and beliefs. Assess the depth of religious exploration, presence of spiritual themes, and portrayal of faith-related conflicts or harmony. Consider the tone towards religion, whether reverent, critical, or neutral. Gauge the text's focus on moral or ethical dilemmas tied to religious teachings.",
      "prompt": "Rate the following song 0-10, regarding its \"religious\" content. Guideline for \"religious\" metrics: Evaluate religious content by identifying explicit references to religions (e.g., Christianity, Islam), their practices, symbols, and beliefs. Assess the depth of religious exploration, presence of spiritual themes, and portrayal of faith-related conflicts or harmony. Consider the tone towards religion, whether reverent, critical, or neutral. Gauge the text's focus on moral or ethical dilemmas tied to religious teachings. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "comedic",
      "title": "Comedic",
      "description": "Assess comedic content by evaluating humor type (satire, slapstick, dry, wit), laughter intensity, and originality. Examine the use of comedic timing, language play, and incongruity in situations or dialogues. Consider cultural and contextual relevance, and the ability to evoke amusement across diverse audiences. Rate based on the cleverness of jokes, the presence of comedic characters or scenarios, and the overall enjoyment and light-heartedness conveyed.",
      "prompt": "Rate the following song 0-10, regarding its \"comedic\" content. Guideline for \"comedic\" metrics: Assess comedic content by evaluating humor type (satire, slapstick, dry, wit), laughter intensity, and originality. Examine the use of comedic timing, language play, and incongruity in situations or dialogues. Consider cultural and contextual relevance, and the ability to evoke amusement across diverse audiences. Rate based on the cleverness of jokes, the presence of comedic characters or scenarios, and the overall enjoyment and light-heartedness conveyed. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    },
    {
      "id": "sad",
      "title": "Sad",
      "description": "For sad content, evaluate emotional depth, expressions of grief, loss, or melancholy. Assess imagery and symbols of sorrow, the tone's heaviness, and language that evokes feelings of despair or loneliness. Consider the narrative's focus on themes like heartbreak, adversity, or existential angst. Rate based on the intensity of sadness conveyed, the complexity of the emotional experience, and the text's ability to elicit empathy or reflection on sorrowful aspects of life.",
      "prompt": "Rate the following song 0-10, regarding its \"sad\" content. Guideline for \"sad\" metrics: For sad content, evaluate emotional depth, expressions of grief, loss, or melancholy. Assess imagery and symbols of sorrow, the tone's heaviness, and language that evokes feelings of despair or loneliness. Consider the narrative's focus on themes like heartbreak, adversity, or existential angst. Rate based on the intensity of sadness conveyed, the complexity of the emotional experience, and the text's ability to elicit empathy or reflection on sorrowful aspects of life. \nSong Lyrics: {{query}}\nPlease respond with json and only json in this format:\n{\n  \"contentRating\": 0\n}"
    }
  ];