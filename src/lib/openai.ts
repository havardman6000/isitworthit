import OpenAI from 'openai';

// Initialize the OpenAI client with Open Router configuration
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': window.location.origin, // Required for OpenRouter API
    'X-Title': 'Is It Worth It?',   // Optional, but helpful for OpenRouter tracking
  },
  dangerouslyAllowBrowser: true // Caution: should be proxied through a backend in production
});

// Update to use the exact Hermes 3 model based on Llama 3.1 70B
const HERMES_3_MODEL = 'nousresearch/hermes-3-llama-3.1-70b';

// Logger for AI model usage
function logModelUsage(model: string, action: string, additionalInfo?: any) {
  const timestamp = new Date().toISOString();
  console.log(`🤖 [${timestamp}] AI Model: ${model} | Action: ${action}`);
  
  if (additionalInfo) {
    console.log('📊 Additional info:', additionalInfo);
  }
  
  // Display in UI if we're in development
  if (import.meta.env.DEV) {
    const modelInfo = document.getElementById('ai-model-info');
    if (!modelInfo) {
      const infoDiv = document.createElement('div');
      infoDiv.id = 'ai-model-info';
      infoDiv.style.position = 'fixed';
      infoDiv.style.bottom = '10px';
      infoDiv.style.right = '10px';
      infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      infoDiv.style.color = 'white';
      infoDiv.style.padding = '10px';
      infoDiv.style.borderRadius = '5px';
      infoDiv.style.zIndex = '9999';
      infoDiv.style.fontSize = '12px';
      infoDiv.style.maxWidth = '300px';
      infoDiv.textContent = `Using: ${model}`;
      document.body.appendChild(infoDiv);
    } else {
      modelInfo.textContent = `Using: ${model}`;
    }
  }
}

export interface WorthComparisonResult {
  price: string;
  comparisons: { text: string; emoji: string }[];
  modelUsed?: string; // Add model information to response
}

// Store base items we've used recently to avoid repetition
const recentItemTypes = new Set<string>();
const MAX_RECENT_ITEMS = 50;

// Store complete recent comparison texts
const recentComparisons = new Set<string>();
const MAX_RECENT_COMPARISONS = 300;

// Last result's items to ensure no immediate repeats
let lastResultItems: string[] = [];

/**
 * Detects if the input might be a person's name
 */
function mightBePersonName(input: string): boolean {
  // Common titles and prefixes that suggest a person
  const namePrefixes = ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'lady', 'lord'];
  const famousPeople = ['trump', 'biden', 'obama', 'elon musk', 'bezos', 'zuckerberg', 'kardashian', 'jenner', 'bieber', 'swift', 'beyonce', 'madonna'];
  
  const lower = input.toLowerCase();
  
  // Check for prefixes
  if (namePrefixes.some(prefix => lower.startsWith(prefix + ' '))) {
    return true;
  }
  
  // Check for famous people
  if (famousPeople.some(name => lower.includes(name))) {
    return true;
  }
  
  // Check for "first last" name pattern with capital letters
  const words = input.split(' ');
  if (words.length >= 2 && words.length <= 4) {
    const allWordsCapitalized = words.every(word => word.length > 0 && word[0] === word[0].toUpperCase());
    if (allWordsCapitalized) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detects if the input is an abstract or sentimental concept that should be "priceless"
 */
function isPricelessConcept(input: string): boolean {
  const pricelessConcepts = [
    'love', 'lover', 'friendship', 'happiness', 'peace', 'joy', 'family', 
    'mother', 'father', 'dad', 'mom', 'parent', 'child', 'baby', 
    'soul', 'heart', 'mind', 'life', 'freedom', 'liberty', 'justice',
    'happiness', 'friendship', 'health', 'time', 'memories', 'wisdom',
    'wife', 'husband', 'spouse', 'partner', 'marriage', 'relationship'
  ];
  
  const lower = input.toLowerCase();
  
  // Direct mentions of priceless concepts
  if (pricelessConcepts.some(concept => 
    lower === concept || 
    lower === `a ${concept}` || 
    lower === `my ${concept}` || 
    lower === `your ${concept}` ||
    lower === `the ${concept}` ||
    lower.includes(`${concept}'s`)
  )) {
    return true;
  }
  
  // Phrases containing priceless concepts
  if (lower.includes('mother\'s love') || 
      lower.includes('father\'s love') ||
      lower.includes('parent\'s love') ||
      lower.includes('true love') ||
      lower.includes('true friend') ||
      lower.includes('best friend') ||
      lower.includes('peace of mind') ||
      lower.includes('good health')) {
    return true;
  }
  
  return false;
}

/**
 * Check with the AI model if a concept should be considered priceless
 */
async function shouldBePriceless(input: string): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: HERMES_3_MODEL,
      messages: [
        { 
          role: 'system', 
          content: `You must determine if assigning a monetary value to the following concept is ethical or appropriate.
                    Respond with ONLY "YES" or "NO".
                    
                    YES = It is ethical and appropriate to assign a price to this (like products, services, commodities)
                    NO = It is unethical or inappropriate to assign a price to this (like people, relationships, human rights)
                    
                    Answer "NO" for:
                    - People (wife, husband, friend)
                    - Human relationships (marriage, friendship)
                    - Human attributes (love, health, happiness)
                    - Human rights (freedom, dignity)

                    Answer "YES" for:
                    - Products (phone, car)
                    - Services (cleaning, consulting)
                    - Commodities (gold, coffee)
                    - Properties (house, land)`
        },
        { role: 'user', content: `Can I ethically assign a monetary value to: ${input}?` }
      ],
      temperature: 0.1,
      max_tokens: 5
    });
    
    const answer = response.choices[0]?.message?.content?.trim().toUpperCase();
    return answer === 'NO';
  } catch (error) {
    console.error('Error checking if concept is priceless:', error);
    // Fall back to static check if API call fails
    return isPricelessConcept(input);
  }
}

/**
 * Generates special comparisons for priceless items
 */
function generatePricelessComparisons(): { text: string; emoji: string }[] {
  const pricelessComparisons = [
    { text: "1 million sunset views", emoji: "🌅" },
    { text: "infinite smiles from a child", emoji: "👶" },
    { text: "10000 sincere thank yous", emoji: "🙏" },
    { text: "countless warm hugs", emoji: "🤗" },
    { text: "a lifetime of happy memories", emoji: "🧠" },
    { text: "all the stars in the sky", emoji: "✨" },
    { text: "every grain of sand on earth", emoji: "🏝️" },
    { text: "infinite heartbeats of joy", emoji: "❤️" },
    { text: "bottomless cups of happiness", emoji: "☕" },
    { text: "all the oxygen in the atmosphere", emoji: "💨" },
    { text: "endless moments of peace", emoji: "☮️" },
    { text: "timeless works of art", emoji: "🎨" },
    { text: "eternal birthday wishes", emoji: "🎂" },
    { text: "every tear of happiness ever shed", emoji: "😂" },
    { text: "unlimited second chances", emoji: "🔄" },
    { text: "depths of oceanic understanding", emoji: "🌊" },
    { text: "mountains of supportive words", emoji: "⛰️" },
    { text: "forest-worth of deep breaths", emoji: "🌲" },
    { text: "galaxies of inner peace", emoji: "🌌" },
    { text: "unlimited do-overs", emoji: "🔁" }
  ];
  
  // Shuffle array using Fisher-Yates algorithm
  for (let i = pricelessComparisons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pricelessComparisons[i], pricelessComparisons[j]] = [pricelessComparisons[j], pricelessComparisons[i]];
  }
  
  // Return 5-7 random items
  const count = Math.floor(Math.random() * 3) + 5; // 5-7
  return pricelessComparisons.slice(0, count);
}

/**
 * Extracts the core item type from a comparison text
 */
function extractItemType(text: string): string {
  const lower = text.toLowerCase();
  
  // Remove numbers and common words to get the core item
  return lower
    .replace(/^\d+(\.\d+)?\s+/, '') // Remove leading numbers
    .replace(/(\d+|of|the|and|to|for|with|by|in|on|at|from)/g, '') // Remove common words and numbers
    .trim();
}

/**
 * Helper function to get appropriate emoji based on comparison text
 */
function getEmojiForComparison(text: string): string {
  const lower = text.toLowerCase();
  
  // Food & drinks
  if (lower.includes('big mac') || lower.includes('burger')) return '🍔';
  if (lower.includes('steak') || lower.includes('meat')) return '🥩';
  if (lower.includes('sushi')) return '🍣';
  if (lower.includes('beer') || lower.includes('alcohol')) return '🍺';
  if (lower.includes('coffee')) return '☕';
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('whiskey') || lower.includes('bourbon')) return '🥃';
  if (lower.includes('bread') || lower.includes('loaf')) return '🍞';
  if (lower.includes('banana')) return '🍌';
  if (lower.includes('apple')) return '🍎';
  if (lower.includes('chocolate')) return '🍫';
  if (lower.includes('candy')) return '🍬';
  if (lower.includes('donut')) return '🍩';
  
  // Objects
  if (lower.includes('toilet')) return '🚽';
  if (lower.includes('gun') || lower.includes('weapon') || lower.includes('firearm')) return '🔫';
  if (lower.includes('knife') || lower.includes('stab')) return '🔪';
  if (lower.includes('bomb') || lower.includes('explosive')) return '💣';
  if (lower.includes('fire') || lower.includes('burn')) return '🔥';
  if (lower.includes('blood') || lower.includes('plasma')) return '🩸';
  if (lower.includes('pencil') || lower.includes('pen')) return '✏️';
  if (lower.includes('book') || lower.includes('novel')) return '📚';
  if (lower.includes('newspaper')) return '📰';
  if (lower.includes('magazine')) return '📖';
  
  // Crime & controversial
  if (lower.includes('murder') || lower.includes('kill')) return '💀';
  if (lower.includes('drug') || lower.includes('cocaine')) return '💊';
  if (lower.includes('jail') || lower.includes('prison')) return '🏢';
  if (lower.includes('bribe') || lower.includes('corrupt')) return '💰';
  if (lower.includes('kidnap')) return '🥷';
  if (lower.includes('cartel')) return '💼';
  if (lower.includes('scam')) return '🎭';
  
  // Tech & Media
  if (lower.includes('crypto') || lower.includes('punk')) return '🖼️';
  if (lower.includes('influencer')) return '📸';
  if (lower.includes('apology')) return '🙇‍♂️';
  if (lower.includes('dao')) return '📜';
  if (lower.includes('discord')) return '💬';
  if (lower.includes('movie') || lower.includes('ticket') || lower.includes('film')) return '🎬';
  if (lower.includes('lawsuit')) return '⚖️';
  if (lower.includes('pirat')) return '🏴‍☠️';
  if (lower.includes('fake id') || lower.includes('identity')) return '🪪';
  
  // Transportation
  if (lower.includes('lambo')) return '🏎️';
  if (lower.includes('flight') || lower.includes('plane')) return '✈️';
  if (lower.includes('bus ticket') || lower.includes('transit')) return '🚌';
  if (lower.includes('train')) return '🚆';
  
  // Religious or blasphemous
  if (lower.includes('church') || lower.includes('bible')) return '📿';
  if (lower.includes('god') || lower.includes('jesus')) return '✝️';
  if (lower.includes('sin') || lower.includes('hell')) return '😈';
  
  // Body parts & medical
  if (lower.includes('organ')) return '🫀';
  if (lower.includes('therapy')) return '🛋️';
  if (lower.includes('doctor') || lower.includes('medical')) return '🩺';
  
  // Relationships
  if (lower.includes('divorce') || lower.includes('breakup')) return '💔';
  if (lower.includes('dating')) return '❤️';
  if (lower.includes('wedding')) return '💍';
  
  // Misc
  if (lower.includes('goat')) return '🐐';
  if (lower.includes('airdrop')) return '🎁';
  if (lower.includes('rug pull') || lower.includes('rugpull')) return '🪤';
  if (lower.includes('island')) return '🏝️';
  if (lower.includes('failure') || lower.includes('failed')) return '📉';
  
  return '🪙'; // fallback
}

/**
 * Generic price reference data for ensuring accurate comparisons
 */
const priceReferences = {
  // Food & Drink (in USD)
  bigMac: 5.15,
  coffee: 4.50,
  beer: 7.00,
  cocktail: 12.00,
  steak: 35.00,
  pizza: 15.00,
  bread: 3.50,
  
  // Common items
  movie: 12.00,
  book: 18.00,
  pen: 1.50,
  newspaper: 2.00,
  busTicket: 2.50,
  
  // Expensive items
  organ: 50000.00,
  divorce: 15000.00,
  cartelActivity: 50000.00,
  goldToilet: 30000.00,
  luxuryCar: 90000.00
};

/**
 * Generate price-appropriate comparison examples based on the item price
 */
function getPriceAppropriateExamples(price: number): string {
  if (price < 10) {
    return `* For a $${price.toFixed(2)} item:
       - ${(price / priceReferences.newspaper).toFixed(1)} newspapers
       - ${(price / priceReferences.pen).toFixed(1)} cheap pens
       - ${(price / priceReferences.bread).toFixed(1)} loaves of bread
       - ${(price / 0.25).toFixed(0)} gumballs from a machine
       - ${(price / 1.5).toFixed(1)} bus fare tokens`;
  } else if (price < 100) {
    return `* For a $${price.toFixed(2)} item:
       - ${(price / priceReferences.bigMac).toFixed(1)} Big Macs
       - ${(price / priceReferences.movie).toFixed(1)} movie tickets
       - ${(price / priceReferences.coffee).toFixed(1)} fancy coffees
       - ${(price / priceReferences.pizza).toFixed(1)} large pizzas
       - ${(price / 5).toFixed(1)} cheap bottles of wine`;
  } else if (price < 1000) {
    return `* For a $${price.toFixed(2)} item:
       - ${(price / priceReferences.steak).toFixed(0)} premium steaks
       - ${(price / 50).toFixed(1)} cheap shoes
       - ${(price / 100).toFixed(1)} concert tickets
       - ${(price / 150).toFixed(1)} monthly grocery bills
       - ${(price / 200).toFixed(1)} cheap hotel nights`;
  } else if (price < 10000) {
    return `* For a $${price.toFixed(0)} item:
       - ${(price / 1000).toFixed(2)} months of rent
       - ${(price / 800).toFixed(1)} smartphone replacements
       - ${(price / 1200).toFixed(1)} weekend getaways
       - ${(price / 2000).toFixed(2)} cheap international flights
       - ${(price / 3000).toFixed(2)} used appliance sets`;
  } else if (price < 100000) {
    return `* For a $${price.toFixed(0)} item:
       - ${(price / 20000).toFixed(2)} cheap used cars
       - ${(price / 15000).toFixed(2)} college semesters
       - ${(price / 25000).toFixed(2)} wedding ceremonies
       - ${(price / 30000).toFixed(2)} years of average rent`;
  } else {
    return `* For a $${price.toFixed(0)} item:
       - ${(price / 50000).toFixed(1)} luxury SUVs
       - ${(price / 100000).toFixed(2)} small houses in rural areas
       - ${(price / 80000).toFixed(2)} years of average salary
       - ${(price / 150000).toFixed(2)} four-year college educations
       - ${(price / 400000).toFixed(3)} retirement funds`;
  }
}

/**
 * Clean and validate JSON response from the model
 */
function cleanModelResponse(content: string, estimatedPrice: number): string {
  console.log("Raw model response:", content);
  
  try {
    // First try to parse directly
    JSON.parse(content);
    return content;
  } catch (e) {
    console.log("Initial JSON parsing failed, attempting to clean response");
    
    try {
      // Remove any markdown formatting
      let cleaned = content.replace(/```json|```/g, '').trim();
      
      // Fix common emoji formatting issues (this is the primary cause of parsing errors)
      cleaned = cleaned.replace(/"emoji"\s*:\s*(?!")([^",}\s]+)"/g, '"emoji": "$1"'); // Missing opening quote
      cleaned = cleaned.replace(/"emoji"\s*:\s*"?([^",}\s]+)"?\s*[,}]/g, '"emoji": "$1"}'); // Missing closing quote
      cleaned = cleaned.replace(/"emoji"\s*:\s*"([^"]*)",?\s*}/g, '"emoji": "$1"}'); // Fix trailing commas
      cleaned = cleaned.replace(/"emoji"\s*:\s*:?([^",}\s]+)/g, '"emoji": "$1"'); // Fix colons
      cleaned = cleaned.replace(/"emoji"\s*:\s*([^",}\s"]+)/g, '"emoji": "$1"'); // Missing quotes entirely
      
      // Fix potential comma issues
      cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1'); // Remove trailing commas in arrays/objects
      cleaned = cleaned.replace(/,,/g, ','); // Fix double commas
      cleaned = cleaned.replace(/}([^,])\{/g, '},$1{'); // Add missing commas between objects
      cleaned = cleaned.replace(/}\s*"/g, '},"'); // Add missing commas between objects and strings
      
      // Try to parse the extensively cleaned content
      try {
        JSON.parse(cleaned);
        return cleaned;
      } catch (e) {
        console.log("Advanced cleaning failed, trying more aggressive approaches");
        
        // More aggressive cleaning
        // Try to extract just the valid parts from broken JSON
        const priceMatch = content.match(/"price"\s*:\s*(\d+)/);
        const comparisonsMatch = content.match(/"comparisons"\s*:\s*\[([\s\S]*?)\]/);
        
        if (priceMatch && comparisonsMatch) {
          const price = parseFloat(priceMatch[1]);
          let comparisonsText = comparisonsMatch[1];
          
          // Fix any broken emoji entries in the comparisons array
          comparisonsText = comparisonsText.replace(/("emoji"\s*:\s*)(?!")([^",}\s]+)/g, '$1"$2"');
          
          const constructedJson = `{
            "price": ${price},
            "comparisons": [${comparisonsText}]
          }`;
          
          try {
            // Try to parse our manually constructed version
            JSON.parse(constructedJson);
            return constructedJson;
          } catch (e) {
            // If still failing, move to manual extraction
          }
        }
        
        // Last resort: Extract individual valid comparisons
        const comparisons = [];
        const comparisonRegex = /\{\s*"text"\s*:\s*"([^"]+)"\s*,\s*"emoji"\s*:\s*"?([^",}]+)"?\s*\}/g;
        let match;
        
        while ((match = comparisonRegex.exec(content)) !== null) {
          if (match[1] && match[2]) {
            comparisons.push({
              text: match[1],
              emoji: match[2].replace(/:/g, '') // Remove any colons from emoji
            });
          }
        }
        
        // If we couldn't extract enough valid comparisons, use dark fallbacks
        if (comparisons.length < 3) {
          return JSON.stringify({
            price: estimatedPrice,
            comparisons: getDarkFallbackComparisons(estimatedPrice)
          });
        }
        
        // Return the manually extracted comparisons
        return JSON.stringify({
          price: estimatedPrice,
          comparisons: comparisons
        });
      }
    } catch (cleanError) {
      console.error("Failed to clean JSON response:", cleanError);
      
      // Return a fallback JSON with dark fallbacks
      return JSON.stringify({
        price: estimatedPrice,
        comparisons: getDarkFallbackComparisons(estimatedPrice)
      });
    }
  }
}

/**
 * Gets absurd, factual worth comparisons for an item using OpenAI
 */
export async function getWorthComparisons(
  item: string,
  country?: string
): Promise<WorthComparisonResult> {
  let modelUsed = ""; // Track which model was used
  
  try {
    // First, check with the AI if this is something that should have a price
    const aiThinksPriceless = await shouldBePriceless(item);
    
    // Check if this is a priceless concept either by static check or AI determination
    if (aiThinksPriceless || isPricelessConcept(item)) {
      logModelUsage(HERMES_3_MODEL, "Determined item should be priceless", { 
        item, 
        aiDetermined: aiThinksPriceless,
        staticDetermined: isPricelessConcept(item)
      });
      
      return {
        price: "Priceless",
        comparisons: generatePricelessComparisons(),
        modelUsed: "Ethical check by " + HERMES_3_MODEL
      };
    }
    
    // Handle person name differently - get net worth instead
    const isPersonName = mightBePersonName(item);
    
    // First, get a reasonable price estimate for the item
    let priceEstimatePrompt = "";
    
    if (isPersonName) {
      priceEstimatePrompt = `Estimate the net worth in USD for the person: ${item}.
      
      Be very factual and accurate. Give only a number, no text. If you're not sure, estimate based on their profession or status.
      
      Examples:
      - Donald Trump: 2500000000
      - Taylor Swift: 1200000000
      - An average doctor: 1500000
      - A typical teacher: 250000
      
      Return only the number with no currency symbol, commas, or other text.`;
    } else {
      priceEstimatePrompt = `Estimate the realistic average price in USD for: ${item}${country ? ` in ${country}` : ''}. 
      
      Be very factual and accurate accounting for country-specific pricing. Give only a number, no text.
      
      Examples with country variations:
      - Porsche 911 in USA: 120000
      - Porsche 911 in Singapore: 440000
      - iPhone 15 Pro in USA: 999
      - iPhone 15 Pro in Brazil: 1800
      - Big Mac in USA: 5.15
      - Big Mac in Switzerland: 13.00
      - Coffee at Starbucks in USA: 4.75
      - Coffee at Starbucks in UAE: 6.80
      - Rent for 1-bedroom in NYC: 3500
      - Rent for 1-bedroom in Bangkok: 650
      
      Return only the number with no currency symbol, commas, or other text.`;
    }
    
    logModelUsage(HERMES_3_MODEL, "Starting price estimation request", { item, isPersonName });
    
    const priceResponse = await openai.chat.completions.create({
      model: HERMES_3_MODEL, 
      messages: [
        { role: 'system', content: 'You are a factual price database. Return only numerical price estimates with no text.' },
        { role: 'user', content: priceEstimatePrompt }
      ],
      temperature: 0.1 // Keep very factual
    });
    
    modelUsed = priceResponse.model || HERMES_3_MODEL;
    logModelUsage(modelUsed, "Received price estimation response");
    
    let estimatedPrice = 0;
    const priceContent = priceResponse.choices[0]?.message?.content;
    
    if (priceContent) {
      // Extract just the number from the response
      const priceMatch = priceContent.match(/(\d+(\.\d+)?)/);
      if (priceMatch) {
        estimatedPrice = parseFloat(priceMatch[0]);
        logModelUsage(modelUsed, "Extracted price", { estimatedPrice });
      }
    }
    
    // Fallback prices if estimation fails
    if (isNaN(estimatedPrice) || estimatedPrice <= 0) {
      const itemLower = item.toLowerCase();
      
      if (isPersonName) {
        // Fallback for celebrities and well-known people
        if (itemLower.includes('trump')) estimatedPrice = 2500000000;
        else if (itemLower.includes('biden') || itemLower.includes('president')) estimatedPrice = 10000000;
        else if (itemLower.includes('musk') || itemLower.includes('elon')) estimatedPrice = 180000000000;
        else if (itemLower.includes('bezos')) estimatedPrice = 140000000000;
        else if (itemLower.includes('swift') || itemLower.includes('taylor')) estimatedPrice = 1200000000;
        else if (itemLower.includes('kardashian')) estimatedPrice = 1800000000;
        else if (itemLower.includes('bieber')) estimatedPrice = 300000000;
        else if (itemLower.includes('actor') || itemLower.includes('actress')) estimatedPrice = 20000000;
        else if (itemLower.includes('singer') || itemLower.includes('musician')) estimatedPrice = 15000000;
        else if (itemLower.includes('athlete') || itemLower.includes('player')) estimatedPrice = 25000000;
        else estimatedPrice = 5000000; // Generic celebrity fallback
      } else {
        // Normal item fallbacks
        if (itemLower.includes('porsche') || itemLower.includes('911')) estimatedPrice = 120000;
        else if (itemLower.includes('house') || itemLower.includes('home')) estimatedPrice = 350000;
        else if (itemLower.includes('car')) estimatedPrice = 30000;
        else if (itemLower.includes('phone')) estimatedPrice = 1000;
        else if (itemLower.includes('coffee')) estimatedPrice = 4.50;
        else if (itemLower.includes('bread')) estimatedPrice = 2.50;
        else if (itemLower.includes('pizza')) estimatedPrice = 15.00;
        else estimatedPrice = 500;
      }
      logModelUsage(modelUsed, "Used fallback price", { estimatedPrice });
    }
    
    // Sanity check for common items to ensure pricing is reasonable
    const itemLower = item.toLowerCase();
    if (itemLower.includes('pizza') && (estimatedPrice < 5 || estimatedPrice > 50)) {
      estimatedPrice = 15.00;
    } else if (itemLower.includes('coffee') && (estimatedPrice < 1 || estimatedPrice > 10)) {
      estimatedPrice = 4.50;
    } else if (itemLower.includes('bread') && (estimatedPrice < 1 || estimatedPrice > 10)) {
      estimatedPrice = 2.50;
    }
    
    // Update the system prompt to mix relatable everyday items with darker, gory items

    // System prompt with mixed tangible comparisons
    const systemPrompt = `You are the backend AI brain for "Is It Worth It?" - a financial reality check app that uses TANGIBLE COMPARISONS WITH SHOCK VALUE.

Your job: Create a disturbing contrast between everyday items and dark physical realities.

CONTEXT:
- Item: "${item}"
- Price: $${estimatedPrice.toFixed(2)}
- Country: ${country || "Global"}

CREATE 7-8 MIXED TANGIBLE COMPARISONS that:
1. Start with a number
2. Use two categories of physical items people can visualize:

CATEGORY A - EVERYDAY RELATABLE ITEMS:
- Fast food (McDonald's Big Macs, Starbucks coffees)
- Common clothing (jeans, t-shirts, Nike shoes)
- Popular electronics (iPhones, PlayStation consoles)
- Basic groceries (milk gallons, loaves of bread)
- Common services (haircuts, movie tickets, Uber rides)

CATEGORY B - SHOCKING/GORY ITEMS:
- Body parts (kidneys, eyes, pints of blood, hearts)
- Medical items (syringes, hospital beds, caskets)
- Protection items (bulletproof vests, gas masks)
- Controversial items (condoms, drug doses, bullets)
- Survival necessities (water purifiers, emergency rations)

BALANCE: Include items from both categories, but make them all physical things.

EXAMPLES OF PERFECT MIXED COMPARISONS:
- "44,000 Big Macs from McDonald's" + "🍔"
- "8,800 human kidneys on black markets" + "🫀"
- "17,600 boxes of condoms" + "🧴"
- "5,500 PlayStation 5 consoles" + "🎮"
- "2,200 human eyes sold illegally" + "👁️"
- "36,000 movie theater tickets" + "🎬"
- "1,100 bulletproof vests for children" + "🛡️"
- "73,400 pints of donated blood" + "🩸"

FORMAT RULES:
1. Keep under 60 CHARACTERS
2. START with a NUMBER
3. Describe ONLY PHYSICAL OBJECTS (not situations or concepts)
4. Mix everyday items with shocking ones
5. One emoji per comparison

YOUR RESPONSE MUST BE VALID JSON:
{
  "price": ${estimatedPrice},
  "comparisons": [
    {"text": "44,000 Big Macs from McDonald's", "emoji": "🍔"},
    {"text": "8,800 human kidneys on black markets", "emoji": "🫀"},
    {"text": "17,600 boxes of condoms", "emoji": "🧴"}
  ]
}`;

    // Update the user prompt to emphasize we want EXTREME darkness and tangible references
    const userPrompt = `Generate EXTREMELY DISTURBING financial comparisons for ${item}${country ? ` in ${country}` : ''}. Price: $${estimatedPrice.toFixed(2)}. Focus on REAL HUMAN SUFFERING, NOT crypto. Make it deeply unsettling and tangible. VALID JSON ONLY!`;

    logModelUsage(HERMES_3_MODEL, "Starting comparison generation request");
    
    const response = await openai.chat.completions.create({
      model: HERMES_3_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Slightly higher for more disturbing content
      presence_penalty: 0.7,
      frequency_penalty: 0.7,
      max_tokens: 500,
      stop: ["}}", "]}", "}}}", "]}}}"]
    });

    // Update the model used with the actual model from the response
    modelUsed = response.model || HERMES_3_MODEL;
    logModelUsage(modelUsed, "Received comparison generation response");

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Log the raw response for debugging
    console.log('Raw model response:', content);
    
    // Clean and validate the response
    const cleanedContent = cleanModelResponse(content, estimatedPrice);
    
    try {
      const result = JSON.parse(cleanedContent);

      let priceValue: number;
      if (typeof result.price === 'number') {
        priceValue = result.price;
      } else if (typeof result.price === 'string') {
        const cleaned = result.price.replace(/[^\d.]/g, '');
        priceValue = parseFloat(cleaned);
      } else {
        priceValue = estimatedPrice; // Use our pre-calculated estimate
      }

      // Double-check that our price is reasonable
      if (isNaN(priceValue) || priceValue <= 0) {
        priceValue = estimatedPrice;
      }
      
      // For pizza specifically, sanity check the price 
      // (addresses the issue in the screenshot)
      if (item.toLowerCase().includes('pizza') && priceValue > 50) {
        priceValue = 20; // Reset to reasonable pizza price
      }

      // Format price differently for networth vs regular items
      const formattedPrice = isPersonName ? 
        formatNetWorth(priceValue) : 
        formatPrice(priceValue);

      // Track item types in this result to prevent duplicates within the same set
      const currentResultItemTypes = new Set<string>();
      
      let filteredComparisons = Array.isArray(result.comparisons)
        ? result.comparisons
            .filter(c => {
              // Basic validation
              if (typeof c !== 'object' || !c.text) return false;
              
              // Filter out text with brackets, parentheses, etc.
              if (/[\(\)\[\]\{\}\<\>]/.test(c.text)) return false;
              
              // Filter out texts that are too long
              if (c.text.length > 80) return false;
              
              // Filter out texts with long alphanumeric strings (likely hashes)
              if (/[a-zA-Z0-9]{25,}/.test(c.text)) return false;
              
              // Only keep comparisons that start with a number
              if (!/^\d+(\.\d+)?/.test(c.text)) return false;
              
              // Extract the item type (e.g., "big macs" from "88000 Big Macs")
              const itemType = extractItemType(c.text);
              
              // Check for duplicates within this result set
              if (currentResultItemTypes.has(itemType)) return false;
              
              // Check if we've seen this item type in recent results or if it was in the last result
              if (recentItemTypes.has(itemType) || lastResultItems.includes(itemType)) return false;
              
              // Check if we've seen this exact comparison recently
              if (recentComparisons.has(c.text.toLowerCase())) return false;
              
              // Add to current result's item types
              currentResultItemTypes.add(itemType);
              
              return true;
            })
            .map(c => {
              const comparison = {
                text: c.text,
                emoji: getEmojiForComparison(c.text)
              };
              
              // Extract item type to prevent similar items
              const itemType = extractItemType(c.text);
              
              // Add to recent comparisons and item types to avoid repetition
              recentComparisons.add(c.text.toLowerCase());
              recentItemTypes.add(itemType);
              
              // Keep the sets limited
              if (recentComparisons.size > MAX_RECENT_COMPARISONS) {
                const iterator = recentComparisons.values();
                recentComparisons.delete(iterator.next().value);
              }
              
              if (recentItemTypes.size > MAX_RECENT_ITEMS) {
                const iterator = recentItemTypes.values();
                recentItemTypes.delete(iterator.next().value);
              }
              
              return comparison;
            })
        : [];

      // Generate appropriate backup comparisons
      const backupComparisons = isPersonName ? 
        generateHighValueBackups(priceValue) : 
        generatePriceAppropriateBackups(priceValue);

      // If we have too many, take a random selection ensuring diversity
      if (filteredComparisons.length > 7) {
        // Shuffle the array using Fisher-Yates algorithm
        for (let i = filteredComparisons.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filteredComparisons[i], filteredComparisons[j]] = [filteredComparisons[j], filteredComparisons[i]];
        }
        // Take 5-7 random elements
        const randomCount = Math.floor(Math.random() * 3) + 5; // 5, 6, or 7
        filteredComparisons = filteredComparisons.slice(0, randomCount);
      }
      
      // If we don't have enough, add some backup comparisons
      while (filteredComparisons.length < 5) {
        // Find backups that aren't already used and aren't similar to those used
        const unusedBackups = backupComparisons.filter(backup => {
          const backupType = extractItemType(backup.text);
          return !filteredComparisons.some(c => {
            const comparisonType = extractItemType(c.text);
            // Check if types are similar (to avoid e.g. different alcohol types)
            return comparisonType === backupType || 
              (comparisonType.includes(backupType) || backupType.includes(comparisonType));
          }) && !currentResultItemTypes.has(backupType) && 
             !recentItemTypes.has(backupType) && 
             !lastResultItems.includes(backupType);
        });
        
        if (unusedBackups.length === 0) break; // Safety check
        
        // Add a random unused backup
        const randomIndex = Math.floor(Math.random() * unusedBackups.length);
        const selectedBackup = unusedBackups[randomIndex];
        
        // Add backup's item type to current result tracking
        const backupType = extractItemType(selectedBackup.text);
        currentResultItemTypes.add(backupType);
        
        filteredComparisons.push(selectedBackup);
      }

      // Update lastResultItems for next call
      lastResultItems = Array.from(currentResultItemTypes);
      
      // We're now getting dark content directly from the model, no transformation needed
      logModelUsage(modelUsed, "Completed request successfully", { 
        item, 
        comparisonsCount: filteredComparisons.length,
        price: formattedPrice
      });

      return {
        price: formattedPrice,
        comparisons: filteredComparisons,
        modelUsed: modelUsed
      };
    } catch (parseError) {
      logModelUsage(modelUsed, "Error parsing response", { error: parseError });
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse worth comparisons');
    }
  } catch (error) {
    logModelUsage(modelUsed || HERMES_3_MODEL, "Error in request", { error });
    console.error('Error fetching worth comparisons:', error);
    throw error;
  }
}

/**
 * Formats large net worth values with appropriate suffixes
 */
function formatNetWorth(value: number): string {
  if (isNaN(value) || value <= 0) return '$0';
  
  if (value >= 1000000000) {
    // Format as billions
    return `$${(value / 1000000000).toFixed(1)} billion`;
  } else if (value >= 1000000) {
    // Format as millions
    return `$${(value / 1000000).toFixed(1)} million`;
  } else {
    // Format with commas
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
}

/**
 * Generate backup comparisons that are appropriate for the given price point
 */
function generatePriceAppropriateBackups(price: number): { text: string; emoji: string }[] {
  if (price < 5) {
    return [
      { text: `${(price / 0.25).toFixed(0)} pieces of gum`, emoji: "🍬" },
      { text: `${(price / 0.50).toFixed(1)} newspaper pages`, emoji: "📰" },
      { text: `${(price / 1.00).toFixed(1)} dollar store items`, emoji: "🏪" },
      { text: `${(price / 1.50).toFixed(1)} public bathroom fees`, emoji: "🚽" },
      { text: `${(price / 0.75).toFixed(1)} vending machine snacks`, emoji: "🍫" },
      { text: `${(price / 0.10).toFixed(0)} minutes of public parking`, emoji: "🅿️" },
      { text: `${(price / 0.05).toFixed(0)} thoughts and prayers`, emoji: "🙏" },
      { text: `${(price / 1.00).toFixed(1)} cheap plastic toys`, emoji: "🧸" },
      { text: `${(price / 0.30).toFixed(1)} spam emails`, emoji: "📧" },
      { text: `${(price / 0.99).toFixed(1)} app store purchases`, emoji: "📱" }
    ];
  } else if (price < 20) {
    return [
      { text: `${(price / 5.00).toFixed(1)} fast food meals`, emoji: "🍔" },
      { text: `${(price / 4.50).toFixed(1)} fancy coffees`, emoji: "☕" },
      { text: `${(price / 7.50).toFixed(1)} cheap wine bottles`, emoji: "🍷" },
      { text: `${(price / 3.99).toFixed(1)} gallons of milk`, emoji: "🥛" },
      { text: `${(price / 12.00).toFixed(1)} movie tickets`, emoji: "🎬" },
      { text: `${(price / 10.00).toFixed(1)} basic t-shirts`, emoji: "👕" },
      { text: `${(price / 8.99).toFixed(1)} cheap phone chargers`, emoji: "🔌" },
      { text: `${(price / 15.00).toFixed(1)} large pizzas`, emoji: "🍕" },
      { text: `${(price / 9.99).toFixed(1)} monthly streaming subscriptions`, emoji: "📺" },
      { text: `${(price / 4.99).toFixed(1)} cheap paperbacks`, emoji: "📚" }
    ];
  } else if (price < 100) {
    return [
      { text: `${(price / 35.00).toFixed(1)} premium steaks`, emoji: "🥩" },
      { text: `${(price / 50.00).toFixed(1)} gas station fill-ups`, emoji: "⛽" },
      { text: `${(price / 25.00).toFixed(1)} fast food family meals`, emoji: "🍟" },
      { text: `${(price / 45.00).toFixed(1)} concert t-shirts`, emoji: "👕" },
      { text: `${(price / 75.00).toFixed(1)} cheap wireless earbuds`, emoji: "🎧" },
      { text: `${(price / 30.00).toFixed(1)} used vinyl records`, emoji: "💿" },
      { text: `${(price / 60.00).toFixed(1)} cheap sunglasses`, emoji: "🕶️" },
      { text: `${(price / 40.00).toFixed(1)} sketchy haircuts`, emoji: "💇" },
      { text: `${(price / 20.00).toFixed(1)} budget drug store makeup sets`, emoji: "💄" },
      { text: `${(price / 85.00).toFixed(1)} monthly gym memberships`, emoji: "🏋️" }
    ];
  } else if (price < 1000) {
    return [
      { text: `${(price / 200).toFixed(1)} cheap shoes`, emoji: "👟" },
      { text: `${(price / 150).toFixed(1)} fancy dinners`, emoji: "🍽️" },
      { text: `${(price / 500).toFixed(1)} budget smartphones`, emoji: "📱" },
      { text: `${(price / 300).toFixed(1)} textbooks`, emoji: "📚" },
      { text: `${(price / 250).toFixed(1)} therapy sessions`, emoji: "🛋️" },
      { text: `${(price / 450).toFixed(1)} car repairs`, emoji: "🔧" },
      { text: `${(price / 350).toFixed(1)} concert tickets`, emoji: "🎵" },
      { text: `${(price / 100).toFixed(1)} cheap tattoos`, emoji: "🎨" },
      { text: `${(price / 600).toFixed(1)} vintage leather jackets`, emoji: "🧥" },
      { text: `${(price / 800).toFixed(1)} binge drinking weekends`, emoji: "🍻" }
    ];
  } else if (price < 10000) {
    return [
      { text: `${(price / 1200).toFixed(1)} monthly rent payments`, emoji: "🏠" },
      { text: `${(price / 2000).toFixed(1)} budget vacations`, emoji: "🏖️" },
      { text: `${(price / 1500).toFixed(1)} designer handbags`, emoji: "👜" },
      { text: `${(price / 5000).toFixed(1)} used motorcycles`, emoji: "🏍️" },
      { text: `${(price / 3000).toFixed(1)} gaming computers`, emoji: "🖥️" },
      { text: `${(price / 8000).toFixed(1)} cheap used cars`, emoji: "🚗" },
      { text: `${(price / 4000).toFixed(1)} professional camera setups`, emoji: "📷" },
      { text: `${(price / 1800).toFixed(1)} months of child support`, emoji: "👶" },
      { text: `${(price / 6000).toFixed(1)} emergency room visits`, emoji: "🏥" },
      { text: `${(price / 7000).toFixed(1)} failed small business attempts`, emoji: "📉" }
    ];
  } else if (price < 100000) {
    return [
      { text: `${(price / 20000).toFixed(1)} used sedans`, emoji: "🚗" },
      { text: `${(price / 15000).toFixed(1)} college semesters`, emoji: "🎓" },
      { text: `${(price / 25000).toFixed(1)} budget weddings`, emoji: "💍" },
      { text: `${(price / 30000).toFixed(1)} luxury kitchen renovations`, emoji: "🔪" },
      { text: `${(price / 50000).toFixed(1)} budget divorce settlements`, emoji: "💔" },
      { text: `${(price / 40000).toFixed(1)} tiny homes`, emoji: "🏡" },
      { text: `${(price / 12000).toFixed(1)} years of Netflix subscriptions`, emoji: "📺" },
      { text: `${(price / 35000).toFixed(1)} high-end bathroom renovations`, emoji: "🚿" },
      { text: `${(price / 10000).toFixed(1)} premium gaming setups`, emoji: "🎮" },
      { text: `${(price / 45000).toFixed(1)} luxury watches`, emoji: "⌚" }
    ];
  } else {
    return [
      { text: `${(price / 120000).toFixed(1)} Porsche 911s`, emoji: "🏎️" },
      { text: `${(price / 500000).toFixed(2)} average suburban homes`, emoji: "🏡" },
      { text: `${(price / 250000).toFixed(1)} master's degrees`, emoji: "🎓" },
      { text: `${(price / 200000).toFixed(1)} luxury SUVs`, emoji: "🚙" },
      { text: `${(price / 150000).toFixed(1)} major medical procedures`, emoji: "🏥" },
      { text: `${(price / 1000000).toFixed(2)} typical retirement funds`, emoji: "👴" },
      { text: `${(price / 350000).toFixed(1)} average divorce settlements`, emoji: "💔" },
      { text: `${(price / 750000).toFixed(2)} small beach houses`, emoji: "🏖️" },
      { text: `${(price / 180000).toFixed(1)} luxury boats`, emoji: "⛵" },
      { text: `${(price / 300000).toFixed(1)} helicopter rides to avoid traffic`, emoji: "🚁" }
    ];
  }
}

/**
 * Generate backup comparisons for high net worth individuals
 */
function generateHighValueBackups(netWorth: number): { text: string; emoji: string }[] {
  return [
    { text: `${(netWorth / 500000).toFixed(1)} luxury sports cars`, emoji: "🏎️" },
    { text: `${(netWorth / 1000000).toFixed(1)} high-end apartments`, emoji: "🏢" },
    { text: `${(netWorth / 5000000).toFixed(1)} private jets`, emoji: "✈️" },
    { text: `${(netWorth / 3000000).toFixed(1)} luxury yachts`, emoji: "⛵" },
    { text: `${(netWorth / 25000000).toFixed(1)} private islands`, emoji: "🏝️" },
    { text: `${(netWorth / 100000000).toFixed(2)} professional sports teams`, emoji: "🏆" },
    { text: `${(netWorth / 20000000).toFixed(1)} hospital wings`, emoji: "🏥" },
    { text: `${(netWorth / 10000).toFixed(0)} average american salaries`, emoji: "💰" },
    { text: `${(netWorth / 50000000).toFixed(1)} celebrity mansions`, emoji: "🏰" },
    { text: `${(netWorth / 15000000).toFixed(1)} super yachts`, emoji: "🚢" },
    { text: `${(netWorth / 2000000).toFixed(1)} political campaigns`, emoji: "🗳️" },
    { text: `${(netWorth / 5000).toFixed(0)} epic shopping sprees`, emoji: "🛍️" },
    { text: `${(netWorth / 1000000000).toFixed(2)} skyscrapers`, emoji: "🌃" },
    { text: `${(netWorth / 30000000).toFixed(1)} failed startups`, emoji: "📉" },
    { text: `${(netWorth / 250000).toFixed(0)} college educations`, emoji: "🎓" }
  ];
}

function formatPrice(price: number): string {
  if (isNaN(price) || price <= 0) return '$0.00';
  if (price >= 1000000) return `$${(price / 1000000).toFixed(2)} million`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

// Update the getCryptoFallbackComparisons function to provide darker, non-crypto fallbacks
function getDarkFallbackComparisons(price: number): Array<{text: string, emoji: string}> {
  // Create a wide variety of extremely dark, tangible comparisons
  const fallbacks = [
    { text: `${(price / 500).toFixed(0)} days of child labor in mines`, emoji: "⛏️" },
    { text: `${(price / 2000).toFixed(1)} harvested organs on black market`, emoji: "🫀" },
    { text: `${(price / 15000).toFixed(1)} human trafficking victims`, emoji: "⛓️" },
    { text: `${(price / 50).toFixed(0)} days in a sweatshop without breaks`, emoji: "👕" },
    { text: `${(price / 75000).toFixed(2)} lives lost to medical bankruptcy`, emoji: "💉" },
    { text: `${(price / 1200).toFixed(1)} forced marriages of minors`, emoji: "💍" },
    { text: `${(price / 5).toFixed(0)} hours of prison labor at $0.25/hr`, emoji: "🔒" },
    { text: `${(price / 8).toFixed(0)} meals denied to homeless vets`, emoji: "🍽️" },
    { text: `${(price / 30000).toFixed(1)} deaths from untreated disease`, emoji: "⚰️" },
    { text: `${(price / 300).toFixed(1)} days working while terminally ill`, emoji: "🏥" },
    { text: `${(price / 250000).toFixed(2)} families evicted during pandemic`, emoji: "🏚️" },
    { text: `${(price / 2500).toFixed(1)} untreated mental health crises`, emoji: "🧠" },
    { text: `${(price / 100).toFixed(0)} illegal work hours for migrant labor`, emoji: "🧹" },
    { text: `${(price / 15).toFixed(0)} days of elderly neglect in homes`, emoji: "👵" },
    { text: `${(price / 150000).toFixed(2)} suicides from financial ruin`, emoji: "💸" },
    { text: `${(price / 75).toFixed(0)} overdoses from untreated addiction`, emoji: "💊" },
    { text: `${(price / 40).toFixed(0)} days of dangerous factory work`, emoji: "🏭" },
    { text: `${(price / 10000).toFixed(1)} children dying from lack of water`, emoji: "💧" },
    { text: `${(price / 5000).toFixed(1)} unpaid medical bills causing ruin`, emoji: "📝" },
    { text: `${(price / 25).toFixed(0)} sexual assaults ignored by police`, emoji: "🚨" }
  ];
  
  // Shuffle the array
  for (let i = fallbacks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fallbacks[i], fallbacks[j]] = [fallbacks[j], fallbacks[i]];
  }
  
  // Take 6-8 random elements
  const count = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8
  return fallbacks.slice(0, count);
}
