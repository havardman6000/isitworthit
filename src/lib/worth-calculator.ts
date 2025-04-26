import { getWorthComparisons } from './openai';

// This is a mock API for calculating worth comparisons
// In a real application, you would connect this to OpenAI or another API

export const calculateWorthComparisons = async (
  item: string,
  country?: string
): Promise<{
  price: string;
  comparisons: { text: string; emoji: string }[];
}> => {
  try {
    console.log('DEBUG: calculateWorthComparisons called with item:', item, 'country:', country);
    // Use the OpenAI integration to get real comparisons
    const result = await getWorthComparisons(item, country);
    console.log('DEBUG: OpenAI result:', { price: result.price, comparisonsCount: result.comparisons.length });
    return result;
  } catch (error) {
    console.error('DEBUG: Error in calculateWorthComparisons:', error);
    
    // Fallback to mock data if the API call fails
    console.log('DEBUG: Using mock data fallback');
    const price = getMockPrice(item);
    console.log('DEBUG: Mock price:', price);
    const comparisons = generateMockComparisons(item, price, country);
    console.log('DEBUG: Mock comparisons count:', comparisons.length);
    
    return {
      price: formatPrice(price),
      comparisons,
    };
  }
};

// Helper functions to generate mock data as fallback

function getMockPrice(item: string): number {
  // This is a simple mock function that assigns prices based on keywords
  // Used as a fallback if the API call fails
  const lowercaseItem = item.toLowerCase();
  
  if (lowercaseItem.includes('porsche') || lowercaseItem.includes('ferrari')) return 150000;
  if (lowercaseItem.includes('car')) return 30000;
  if (lowercaseItem.includes('house') || lowercaseItem.includes('home')) return 350000;
  if (lowercaseItem.includes('diamond') || lowercaseItem.includes('gold')) return 15000;
  if (lowercaseItem.includes('laptop') || lowercaseItem.includes('computer')) return 1500;
  if (lowercaseItem.includes('phone')) return 1000;
  if (lowercaseItem.includes('watch')) return 500;
  if (lowercaseItem.includes('dog') || lowercaseItem.includes('cat')) return 1500;
  if (lowercaseItem.includes('coffee') || lowercaseItem.includes('latte')) return 5;
  if (lowercaseItem.includes('vacation') || lowercaseItem.includes('trip')) return 3000;
  
  // For items not matching above, generate a semi-random price based on string length
  const basePrice = 50 + (item.length * 20);
  return basePrice * (1 + Math.random());
}

function formatPrice(price: number): string {
  console.log('DEBUG: worth-calculator formatPrice called with:', price);
  if (isNaN(price)) {
    console.error('DEBUG: NaN price detected in worth-calculator');
    return '$0.00';
  }
  
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)} million`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatQuantity(num: number): string {
  if (num < 0.01) {
    return num.toFixed(4);
  } else if (num < 1) {
    return num.toFixed(2);
  } else if (num < 10) {
    return num.toFixed(1);
  } else {
    return Math.round(num).toString();
  }
}

function generateMockComparisons(
  item: string,
  price: number,
  country?: string
): { text: string; emoji: string }[] {
  // Array of possible comparison templates
  // Used as a fallback if the API call fails
  const comparisonTemplates = [
    { 
      text: (p: number) => `${formatQuantity(p / 5)} Big Macs`,
      emoji: "🍔",
      minPrice: 5,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 3)} cartons of eggs`,
      emoji: "🥚",
      minPrice: 3,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 65000)} Bitcoin, which means you're probably still poor`,
      emoji: "₿",
      minPrice: 100,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 15000)} divorce lawyer retainers (cheaper than actual divorce)`,
      emoji: "⚖️",
      minPrice: 1000,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 20)} pet hamsters that will judge your financial decisions`,
      emoji: "🐹",
      minPrice: 20,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 4)} gallons of gas (highway robbery with extra steps)`,
      emoji: "⛽",
      minPrice: 4,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 1000)} monthly rent payments in a cardboard box mansion`,
      emoji: "🏠",
      minPrice: 500,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 120)} goats (perfect for lawn mowing and judging you)`,
      emoji: "🐐",
      minPrice: 100,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 300)} pints of blood (don't ask how we know this)`,
      emoji: "🩸",
      minPrice: 100,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 150000)} kidneys on the black market (not that we're suggesting anything)`,
      emoji: "🫘",
      minPrice: 1000,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 0.5)} packs of instant noodles for your post-purchase poverty`,
      emoji: "🍜",
      minPrice: 1,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 100000)} college degrees without the student debt trauma`,
      emoji: "🎓",
      minPrice: 10000,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 5)} Starbucks coffees that won't fix your life either`,
      emoji: "☕",
      minPrice: 5,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 10000)} funeral services (in case your budget dies)`,
      emoji: "⚰️",
      minPrice: 1000,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 30000)} average weddings (commitment issues not included)`,
      emoji: "💍",
      minPrice: 1000,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 3000000)} luxury yachts for when you're pretending to be rich`,
      emoji: "🛥️",
      minPrice: 10000,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 5)} tooth fairy payouts (inflation is hitting fantasy creatures too)`,
      emoji: "🧚",
      minPrice: 1,
    },
    { 
      text: (p: number) => `${formatQuantity(p / 250000)} children raised to 18 (therapy costs not included)`,
      emoji: "👶",
      minPrice: 10000,
    },
  ];
  
  // Country-specific comparisons
  const countryComparisons: Record<string, Array<{ text: (p: number) => string; emoji: string; minPrice: number }>> = {
    "us": [
      {
        text: (p: number) => `${formatQuantity(p / 3)} New York hot dogs with questionable ingredients`,
        emoji: "🌭",
        minPrice: 3,
      },
      {
        text: (p: number) => `${formatQuantity(p / 30000)} American weddings with mandatory choreographed dances`,
        emoji: "💃",
        minPrice: 1000,
      }
    ],
    "uk": [
      {
        text: (p: number) => `${formatQuantity(p / 6)} pints of warm British beer`,
        emoji: "🍺",
        minPrice: 5,
      },
      {
        text: (p: number) => `${formatQuantity(p / 3)} proper cups of tea (with biscuits, obviously)`,
        emoji: "🫖",
        minPrice: 3,
      }
    ],
    "jp": [
      {
        text: (p: number) => `${formatQuantity(p / 40)} high-end sushi dinners where they judge your chopstick skills`,
        emoji: "🍣",
        minPrice: 30,
      },
      {
        text: (p: number) => `${formatQuantity(p / 10)} Tokyo subway rides where you'll be packed like sardines`,
        emoji: "🚇",
        minPrice: 5,
      }
    ],
    "au": [
      {
        text: (p: number) => `${formatQuantity(p / 8)} Australian coffees that will make you say 'mate' involuntarily`,
        emoji: "☕",
        minPrice: 5,
      },
      {
        text: (p: number) => `${formatQuantity(p / 25)} deadly spiders you'll find in your shoes (they're free actually)`,
        emoji: "🕷️",
        minPrice: 1,
      }
    ]
  };
  
  // Filter templates that are relevant to the item price
  const relevantTemplates = comparisonTemplates.filter(template => template.minPrice <= price);
  
  // Shuffle templates for randomness
  const shuffledTemplates = [...relevantTemplates].sort(() => Math.random() - 0.5);
  
  // Get a country-specific comparison if a country was provided
  let countrySpecificComparisons: { text: string; emoji: string }[] = [];
  if (country && countryComparisons[country]) {
    countrySpecificComparisons = countryComparisons[country]
      .filter(template => template.minPrice <= price)
      .map(template => ({
        text: template.text(price),
        emoji: template.emoji
      }));
  }
  
  // Generate 7-8 comparisons
  const numberOfComparisons = 7 + Math.floor(Math.random() * 2);
  const generalComparisons = shuffledTemplates
    .slice(0, numberOfComparisons - countrySpecificComparisons.length)
    .map(template => ({
      text: template.text(price),
      emoji: template.emoji
    }));
  
  // Mix country-specific and general comparisons
  const allComparisons = [...countrySpecificComparisons, ...generalComparisons];
  return allComparisons.sort(() => Math.random() - 0.5);
}
